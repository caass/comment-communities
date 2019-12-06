import { SimulationLinkDatum } from "d3-force";
import CommentNode from "./CommentNode";

export default class CommentLink implements SimulationLinkDatum<CommentNode> {
    public source: CommentNode | string | number
    public target: CommentNode | string | number
    public index?: number

    constructor(source: CommentNode, target: CommentNode) {
        this.source = source.data.id
        this.target = target.data.id
    }
}