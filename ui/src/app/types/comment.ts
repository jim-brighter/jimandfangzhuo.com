export class Comment {
    commentId: string = ''
    commentText: string = ''
    createdTime: number = 0

    clear(): void {
        this.commentId = ''
        this.commentText = ''
        this.createdTime = 0
    }
}
