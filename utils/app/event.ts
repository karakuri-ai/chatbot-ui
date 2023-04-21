import { EventEmitter as OriginalEventEmitter } from 'events';

export type PersonalInfoDetectedEvent = {
  type: 'personal_info_detected';
  payload: { message: string };
};

type Event = PersonalInfoDetectedEvent;
type EventType = Event['type'];

export class EventEmitter {
  constructor(private emitter: OriginalEventEmitter) {}
  public emit(event: Event) {
    return this.emitter.emit(event.type, event);
  }

  public addListener(event: EventType, listener: (message: Event) => void) {
    return this.emitter.addListener(event, listener);
  }
}

export const events = new EventEmitter(new OriginalEventEmitter());
