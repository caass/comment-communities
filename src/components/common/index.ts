import CommentLink from './CommentLink'
import CommentNode from './CommentNode'
import CommentsChunk from "./CommentsChunk";
import { getCommentsFromJsonResponse, okResponse } from "./handleFetch";
import { SubredditJsonResponse } from './JsonResponse'
import RedditComment from "./RedditComment";

const getComments = async (cursor?: string): Promise<CommentsChunk> => {
    return fetch("https://www.reddit.com/r/all/comments/.json?limit=100")
        .then(okResponse)
        .then(r => getCommentsFromJsonResponse(r, cursor));
};

export { RedditComment, getComments, CommentsChunk, CommentLink, CommentNode, SubredditJsonResponse };
