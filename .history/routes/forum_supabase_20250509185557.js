// Elriel - Forum Routes (Supabase Version)
// Handles forum, topics, and comments using Supabase database

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const supabase = require('../services/db');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).redirect('/auth/login');
  }
  next();
};

// Helper function to get user forum data (rewards, signature, etc.)
const getUserForumData = async (userId) => {
  try {
    // Get user signature
    const { data: signature, error: signatureError } = await supabase
      .from('user_signatures')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (signatureError && signatureError.code !== 'PGRST116') {
      console.error('Error fetching user signature:', signatureError);
    }

    // Get user rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId);

    if (rewardsError) {
      console.error('Error fetching user rewards:', rewardsError);
    }

    return {
      signature: signature || null,
      userRewards: rewards || []
    };
  } catch (err) {
    console.error('Error in getUserForumData:', err);
    return { signature: null, userRewards: [] };
  }
};

// Serve forums listing
router.get('/', async (req, res) => {
  try {
    // Get all forums
    const { data: forums, error } = await supabase
      .from('forums')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      throw error;
    }

    // Get topic and comment counts for each forum
    const enhancedForums = await Promise.all(forums.map(async (forum) => {
      // Get topic count
      const { data: topicsData, error: topicsError } = await supabase
        .from('forum_topics')
        .select('id', { count: 'exact' })
        .eq('forum_id', forum.id);

      if (topicsError) {
        console.error('Error fetching topic count:', topicsError);
      }

      const topicCount = topicsData?.length || 0;

      // Get comment count and last activity
      const { data: commentsData, error: commentsError } = await supabase
        .from('forum_comments')
        .select(`
          id, created_at,
          forum_topics!inner (forum_id)
        `)
        .eq('forum_topics.forum_id', forum.id)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching comment data:', commentsError);
      }

      const commentCount = commentsData?.length || 0;
      const lastActivity = commentsData && commentsData.length > 0 ? commentsData[0].created_at : null;

      return {
        ...forum,
        topic_count: topicCount,
        comment_count: commentCount,
        last_activity: lastActivity
      };
    }));

    // Pass data to the frontend
    const data = {
      forums: enhancedForums,
      user: req.session.user || null
    };

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/index.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading forums:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Serve single forum view (topic listing)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Get forum
    const { data: forum, error: forumError } = await supabase
      .from('forums')
      .select('*')
      .eq('slug', slug)
      .single();

    if (forumError || !forum) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }

    // Get topics
    const { data: topics, error: topicsError } = await supabase
      .from('forum_topics')
      .select(`
        *,
        users:user_id (username)
      `)
      .eq('forum_id', forum.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (topicsError) {
      throw topicsError;
    }

    // Get comment counts and last activity for each topic
    const enhancedTopics = await Promise.all(topics.map(async (topic) => {
      // Get comment count and last activity
      const { data: comments, error: commentsError } = await supabase
        .from('forum_comments')
        .select('id, created_at')
        .eq('topic_id', topic.id)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching comments for topic:', commentsError);
      }

      return {
        ...topic,
        username: topic.users.username,
        comment_count: comments?.length || 0,
        last_activity: comments && comments.length > 0 ? comments[0].created_at : topic.created_at
      };
    }));

    // Pass data to the frontend
    const data = {
      forum,
      topics: enhancedTopics,
      user: req.session.user || null
    };

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/forum.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading forum:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Serve create topic page
router.get('/:slug/new', isAuthenticated, async (req, res) => {
  try {
    const { slug } = req.params;

    // Get forum
    const { data: forum, error } = await supabase
      .from('forums')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !forum) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }

    // Pass data to the frontend
    const data = {
      forum,
      user: req.session.user
    };

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/new-topic.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading new topic page:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Create new topic
router.post('/:slug/create', isAuthenticated, async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content } = req.body;

    // Validate input
    if (!title || !content) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Title and content are required.'
      });
    }

    // Get forum
    const { data: forum, error: forumError } = await supabase
      .from('forums')
      .select('id')
      .eq('slug', slug)
      .single();

    if (forumError || !forum) {
      return res.status(404).json({
        error: 'Forum not found',
        message: 'The requested forum does not exist.'
      });
    }

    // Insert topic
    const { data: newTopic, error: topicError } = await supabase
      .from('forum_topics')
      .insert({
        forum_id: forum.id,
        user_id: req.session.user.id,
        title,
        content
      })
      .select()
      .single();

    if (topicError) {
      throw topicError;
    }

    // Award reputation for creating a topic
    const { error: reputationError } = await supabase
      .from('profiles')
      .update({ reputation: supabase.rpc('increment', { x: 5 }) })
      .eq('user_id', req.session.user.id);

    if (reputationError) {
      console.error('Error updating reputation:', reputationError);
    }

    // Return success
    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      topicId: newTopic.id
    });
  } catch (err) {
    console.error('Error creating topic:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// View topic
router.get('/topic/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get topic
    const { data: topic, error: topicError } = await supabase
      .from('forum_topics')
      .select(`
        *,
        users:user_id (username),
        forums:forum_id (title, slug)
      `)
      .eq('id', id)
      .single();

    if (topicError || !topic) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }

    // Increment view count
    const { error: updateError } = await supabase
      .from('forum_topics')
      .update({ view_count: topic.view_count + 1 })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating view count:', updateError);
    }

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from('forum_comments')
      .select(`
        *,
        users:user_id (username),
        profiles:user_id (
          glyph_id,
          district_id
        ),
        glyphs:profiles.glyph_id (svg_data),
        districts:profiles.district_id (name)
      `)
      .eq('topic_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      throw commentsError;
    }

    // Get forum data for each user
    const enhancedComments = await Promise.all(comments.map(async (comment) => {
      const userData = await getUserForumData(comment.user_id);
      return {
        ...comment,
        username: comment.users.username,
        glyph_svg: comment.glyphs?.svg_data || null,
        district_name: comment.districts?.name || null,
        userRewards: userData.userRewards,
        signature: userData.signature
      };
    }));

    // Format topic data
    const formattedTopic = {
      ...topic,
      username: topic.users.username,
      forum_title: topic.forums.title,
      forum_slug: topic.forums.slug
    };

    // Pass data to the frontend
    const data = {
      topic: formattedTopic,
      comments: enhancedComments,
      user: req.session.user || null
    };

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/view-topic.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading topic:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Add comment to topic
router.post('/topic/:id/comment', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Validate input
    if (!content) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Comment content is required.'
      });
    }

    // Check if topic exists
    const { data: topic, error: topicError } = await supabase
      .from('forum_topics')
      .select('id')
      .eq('id', id)
      .single();

    if (topicError || !topic) {
      return res.status(404).json({
        error: 'Topic not found',
        message: 'The requested topic does not exist.'
      });
    }

    // Insert comment
    const { data: newComment, error: commentError } = await supabase
      .from('forum_comments')
      .insert({
        topic_id: id,
        user_id: req.session.user.id,
        content
      })
      .select()
      .single();

    if (commentError) {
      throw commentError;
    }

    // Award reputation for commenting
    const { error: reputationError } = await supabase
      .from('profiles')
      .update({ reputation: supabase.rpc('increment', { x: 2 }) })
      .eq('user_id', req.session.user.id);

    if (reputationError) {
      console.error('Error updating reputation:', reputationError);
    }

    // Update topic updated_at timestamp
    const { error: updateError } = await supabase
      .from('forum_topics')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating topic timestamp:', updateError);
    }

    // Return success
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      commentId: newComment.id
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Update user signature
router.post('/signature/update', isAuthenticated, async (req, res) => {
  try {
    const { content, isEnabled } = req.body;

    // Get existing signature
    const { data: existingSignature, error: getError } = await supabase
      .from('user_signatures')
      .select('id')
      .eq('user_id', req.session.user.id)
      .single();

    let result;

    // Insert or update signature
    if (existingSignature) {
      // Update existing signature
      const { error: updateError } = await supabase
        .from('user_signatures')
        .update({
          content,
          is_enabled: isEnabled === true || isEnabled === '1' ? 1 : 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', req.session.user.id);

      if (updateError) {
        throw updateError;
      }

      result = { changes: 1 };
    } else {
      // Insert new signature
      const { error: insertError } = await supabase
        .from('user_signatures')
        .insert({
          user_id: req.session.user.id,
          content,
          is_enabled: isEnabled === true || isEnabled === '1' ? 1 : 0
        });

      if (insertError) {
        throw insertError;
      }

      result = { changes: 1 };
    }

    if (result.changes === 0) {
      throw new Error('Failed to update signature');
    }

    res.json({
      success: true,
      message: 'Signature updated successfully'
    });
  } catch (err) {
    console.error('Error updating signature:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Serve Scrapyard page
router.get('/scrapyard', async (req, res) => {
  try {
    // Get all scrapyard items (using forum_topics table but for scrapyard content)
    const { data: scrapyardForum, error: forumError } = await supabase
      .from('forums')
      .select('id')
      .eq('slug', 'scrapyard')
      .single();

    if (forumError || !scrapyardForum) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }

    const { data: scrapyardItems, error: itemsError } = await supabase
      .from('forum_topics')
      .select(`
        *,
        users:user_id (username)
      `)
      .eq('forum_id', scrapyardForum.id)
      .order('created_at', { ascending: false });

    if (itemsError) {
      throw itemsError;
    }

    // Get comment counts and last activity for each item
    const enhancedItems = await Promise.all(scrapyardItems.map(async (item) => {
      // Get comment count and last activity
      const { data: comments, error: commentsError } = await supabase
        .from('forum_comments')
        .select('id, created_at')
        .eq('topic_id', item.id)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching comments for scrapyard item:', commentsError);
      }

      return {
        ...item,
        username: item.users.username,
        comment_count: comments?.length || 0,
        last_activity: comments && comments.length > 0 ? comments[0].created_at : item.created_at
      };
    }));

    // Pass data to the frontend
    const data = {
      items: enhancedItems,
      user: req.session.user || null
    };

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/scrapyard.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading Scrapyard:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

module.exports = router;
