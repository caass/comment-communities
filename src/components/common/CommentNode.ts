import { SimulationNodeDatum } from "d3-force";
import { SubredditJsonResponse } from './JsonResponse'
import RedditComment from './RedditComment'

export default class CommentNode implements SimulationNodeDatum {

    public data: RedditComment
    public index?: number
    public x: number
    public y: number
    public vx!: number
    public vy!: number
    public color!: string

    constructor(data: RedditComment, x: number, y: number, color: string) {
        this.data = data
        this.color = color
        this.x = x
        this.y = y
    }
}