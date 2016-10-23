export class NotFound {
  constructor(msg) {
    this.name = 'NotFound';
    Error.call(this, msg);
  }
}
