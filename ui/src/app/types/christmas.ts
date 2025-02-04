export class ChristmasItem {
  itemId: string = ''
  itemName: string = ''
  itemLink: string = ''
  itemYear: number = 0
  createdTime: number = 0

  clear(): void {
    this.itemId = ''
    this.itemName = ''
    this.itemLink = ''
    this.itemYear = 0
    this.createdTime = 0
  }
}
