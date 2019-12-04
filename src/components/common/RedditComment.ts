

export default class RedditComment {
  public id: string
  public author: string
  public body: string
  public subreddit: string
  public created: Date
  public href: URL

  constructor(id: string, author: string, body: string, subreddit: string, createdUtc: number, prefixedLink: string) {
    this.id = id
    this.author = author
    this.body = body
    this.subreddit = subreddit
    this.created = new Date(createdUtc * 1000)
    this.href = new URL("https://reddit.com" + prefixedLink)

  }
}
