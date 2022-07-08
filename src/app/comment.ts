export class Comment {
    id: number;
    commentText: string;
    createdTime: Date;

    clear(): void {
        this.id = null;
        this.commentText = null;
        this.createdTime = null;
    }
}
