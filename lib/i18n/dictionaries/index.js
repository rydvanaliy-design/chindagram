import en_common from "./en/common";
import en_posts from "./en/posts";
import en_profile from "./en/profile";
import en_settings from "./en/settings";
import en_messages from "./en/messages";
import en_clubs from "./en/clubs";
import en_events from "./en/events";
import en_discovery from "./en/discovery";
import en_saved from "./en/saved";
import en_notifications from "./en/notifications";
import en_review from "./en/review";
import en_admin from "./en/admin";
import en_auth from "./en/auth";

import th_common from "./th/common";
import th_posts from "./th/posts";
import th_profile from "./th/profile";
import th_settings from "./th/settings";
import th_messages from "./th/messages";
import th_clubs from "./th/clubs";
import th_events from "./th/events";
import th_discovery from "./th/discovery";
import th_saved from "./th/saved";
import th_notifications from "./th/notifications";
import th_review from "./th/review";
import th_admin from "./th/admin";
import th_auth from "./th/auth";

// Each namespace matches one feature area so different contributors can edit
// their own file without touching anyone else's.
export const dictionaries = {
  en: {
    common: en_common,
    posts: en_posts,
    profile: en_profile,
    settings: en_settings,
    messages: en_messages,
    clubs: en_clubs,
    events: en_events,
    discovery: en_discovery,
    saved: en_saved,
    notifications: en_notifications,
    review: en_review,
    admin: en_admin,
    auth: en_auth,
  },
  th: {
    common: th_common,
    posts: th_posts,
    profile: th_profile,
    settings: th_settings,
    messages: th_messages,
    clubs: th_clubs,
    events: th_events,
    discovery: th_discovery,
    saved: th_saved,
    notifications: th_notifications,
    review: th_review,
    admin: th_admin,
    auth: th_auth,
  },
};
