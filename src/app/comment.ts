export class Comment {
    commentId: string;
    commentText: string;
    createdTime: number;

    clear(): void {
        this.commentId = null;
        this.commentText = null;
        this.createdTime = null;
    }
}
