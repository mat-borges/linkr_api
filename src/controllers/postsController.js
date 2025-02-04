import hashtagsRepository from '../repositories/hashtagsRepository.js';
import postsRepository from '../repositories/postsRepository.js';
import urlMetadata from 'url-metadata';

export async function publishLink(req, res) {
  const { link, description } = res.locals.post;
  const { hashtagIds } = res.locals;
  const { user_id } = res.locals.user;

  try {
    await postsRepository.publish(user_id, link, description);
    if (hashtagIds) {
      const post_id = (await postsRepository.getUserPosts(user_id)).rows[0].id;
      for (const hashtag_id of hashtagIds) {
        await hashtagsRepository.relateHashtagPost(post_id, hashtag_id);
      }
    }
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
}

export async function deletePost(req, res) {
  const { id } = req.params;
  const { user_id } = res.locals.user;
  try {
    await hashtagsRepository.deleteHashtag(id);
    await postsRepository.dislikePost(user_id, id)
    await postsRepository.deleteUserPosts(id);
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
}

export async function likePost(req, res) {
  try {
    const { user_id } = res.locals.user;
    const post_id = req.params.id;
    await postsRepository.likePost(user_id, post_id);
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}

export async function dislikePost(req, res) {
  try {
    const { user_id } = res.locals.user;
    const post_id = req.params.id;
    await postsRepository.dislikePost(user_id, post_id);
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}

export async function getLikesByPost(req, res) {
  try {
    const { id } = req.params;
    const likes = await postsRepository.getLikesByPost(id);
    let users = [];
    for (let i = 0; i < likes.rows.length; i++) {
      const name = likes.rows[i].name;
      const user_id = likes.rows[i].user_id;
      const obj = {
        name,
        user_id,
      };
      users.push(obj);
    }
    const data = {
      likeCount: likes.rows.length,
      users,
    };
    res.send(data);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}

export async function getPostMetadata(req, res) {
  try {
    const { id } = req.params;
    const post = await postsRepository.getPostMetadata(id);
    if (post.rowCount < 0) {
      return res.sendStatus(404);
    }
    urlMetadata(post.rows[0].link).then(
      function (metadata) {
        let imagePath = metadata.image;
        const source = metadata.source;
        if (imagePath.length === 0) {
          metadata.image =
            'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Image_not_available.png/640px-Image_not_available.png';
          return res.send(metadata);
        } else if (!imagePath.includes('http')) {
          imagePath = 'https://' + source + imagePath;
          metadata.image = imagePath;
        }
        return res.send(metadata);
      },
      function (error) {
        console.log(error);
        return res.sendStatus(500);
      }
    );
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}

export async function updatePost(req, res){
  const {description} = req.body
  const {id} = req.params
  const {hashtagIds} = res.locals
  try{
    await postsRepository.updateUserPost(description, id)

    if (hashtagIds) {
      for (const hashtag_id of hashtagIds) {
        await hashtagsRepository.deleteHashtag(id, hashtag_id)
        await hashtagsRepository.relateHashtagPost(id, hashtag_id);
      }
    }
    res.sendStatus(200)
  }catch(err){
    res.sendStatus(500)
    console.log(err)
  }
}

export async function repostPost(req, res){
  const { id } = req.params; // post_id
  const { user_id } = res.locals.user; // user_id
  try{
    const checkRepost = await postsRepository.getRepost(id, user_id)
    if(checkRepost.rowCount > 0){
      return res.status(500).send('Post já repostado pelo usuário')
    }else{
      await postsRepository.repost(id, user_id)
    res.sendStatus(201)
  }
}catch(err){
  console.log(err)
  res.sendStatus(500)
  }
}