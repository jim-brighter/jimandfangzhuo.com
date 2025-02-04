interface IComment {
  commentId: string | null
  commentText: string | null
  createdTime: number | null

  validateNewComment(): boolean
}

export type Comment = IComment

export class PlannerComment implements Comment {
  commentId: string | null
  commentText: string | null
  createdTime: number | null

  constructor(json: Comment) {
    this.commentId = json.commentId || null
    this.commentText = json.commentText || null
    this.createdTime = json.createdTime || null
  }

  validateNewComment(): boolean {
    return this.commentText != undefined && this.commentText != null
  }
}
