import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { API_BASE_URL } from "./api/config";



const reverbHost = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
const reverbPort = import.meta.env.VITE_REVERB_PORT;
const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || 'https';

const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: reverbHost,
  wsPort: reverbPort || 80,
  wssPort: reverbPort || 443,
  forceTLS: reverbScheme === 'https',
  enabledTransports: ["ws", "wss"],
  authEndpoint: `${API_BASE_URL}/api/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
    },
  },
});

export default echo;
