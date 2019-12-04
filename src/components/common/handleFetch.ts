import CommentsChunk from "./CommentsChunk";
import { RedditCommentsJsonResponse } from "./JsonResponse";
import RedditComment from "./RedditComment";

const okResponse = async (response: Response | null): Promise<RedditCommentsJsonResponse> => {
  if (response === null) {
    throw new Error("Response was null!");
  }

  if (!response.ok) {
    throw new Error("Response returned non-200 error code!");
  }

  if (response.body === null) {
    throw new Error("Response body was empty!");
  }

  return response.json();
};

const getCommentsFromJsonResponse = (jsonResponse: RedditCommentsJsonResponse, cursor?: string): CommentsChunk => {
  const newComments = new CommentsChunk('', [])

  jsonResponse.data.children.map(({ data }) => {
    if (data.id > newComments.cursor) {
      newComments.cursor = data.id;
    }

    if (cursor && cursor >= data.id) {
      return;
    }

    newComments.comments.push(
      new RedditComment(
        data.id,
        data.author,
        data.body,
        data.subreddit,
        data.created_utc,
        data.permalink
      )
    );
  });

  return newComments
};

export { CommentsChunk, getCommentsFromJsonResponse, okResponse }