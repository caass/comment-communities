import RedditComment from "./RedditComment";

export default class CommentsChunk {
    public cursor: string;
    public comments: RedditComment[];
    constructor(cursor: string, comments: RedditComment[]) {
        this.cursor = cursor;
        this.comments = comments;
    }
}
