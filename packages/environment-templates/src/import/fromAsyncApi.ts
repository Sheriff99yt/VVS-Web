import type { ApiEventDef } from '../types';
import { parametersFromJsonSchemaProperties, slugifyId } from './jsonSchema';

/** AsyncAPI 2.x document subset for import. */
export interface AsyncApiDocument {
  asyncapi?: string;
  info?: { title?: string; description?: string; version?: string };
  channels?: Record<
    string,
    {
      publish?: { message?: AsyncApiMessage };
      subscribe?: { message?: AsyncApiMessage };
    }
  >;
}

interface AsyncApiMessage {
  name?: string;
  title?: string;
  payload?: Record<string, unknown>;
}

export interface ImportAsyncApiOptions {
  idPrefix?: string;
  /** Import publish channels as emit-able events (default true). */
  includePublish?: boolean;
  /** Import subscribe channels as handler events (default true). */
  includeSubscribe?: boolean;
}

export function importEventsFromAsyncApi(
  doc: AsyncApiDocument,
  options: ImportAsyncApiOptions = {}
): ApiEventDef[] {
  const idPrefix = options.idPrefix ?? 'event';
  const includePublish = options.includePublish !== false;
  const includeSubscribe = options.includeSubscribe !== false;
  const events: ApiEventDef[] = [];
  const channels = doc.channels ?? {};

  for (const [channelName, channel] of Object.entries(channels)) {
    if (!channel || typeof channel !== 'object') continue;

    if (includePublish && channel.publish) {
      events.push(
        eventFromMessage(channelName, channel.publish.message, idPrefix, 'publish')
      );
    }
    if (includeSubscribe && channel.subscribe) {
      const sub = eventFromMessage(
        channelName,
        channel.subscribe.message,
        idPrefix,
        'subscribe'
      );
      if (!events.some((e) => e.id === sub.id)) {
        events.push(sub);
      }
    }
  }

  return dedupeEvents(events);
}

function eventFromMessage(
  channelName: string,
  message: AsyncApiMessage | undefined,
  idPrefix: string,
  role: 'publish' | 'subscribe'
): ApiEventDef {
  const channelSlug = slugifyId(channelName.replace(/\//g, '_'));
  const messageName = message?.name ? slugifyId(message.name) : channelSlug;
  const eventId = `${idPrefix}.${messageName}${role === 'subscribe' ? '.sub' : ''}`;
  const payload = message?.payload;
  const properties =
    payload && typeof payload.properties === 'object'
      ? (payload.properties as Record<string, unknown>)
      : undefined;

  return {
    id: eventId,
    name: message?.title ?? messageName ?? channelSlug,
    parameters: parametersFromJsonSchemaProperties(properties, eventId),
  };
}

function dedupeEvents(events: ApiEventDef[]): ApiEventDef[] {
  const seen = new Set<string>();
  const out: ApiEventDef[] = [];
  for (const e of events) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}
