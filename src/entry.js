import {TelegramClient,Api} from "telegram";
import {StringSession} from "telegram/sessions";
import {CustomFile} from "telegram/client/uploads";
import {Buffer} from "buffer";
window.TGLib={TelegramClient:TelegramClient,Api:Api,StringSession:StringSession,CustomFile:CustomFile,Buffer:Buffer};
