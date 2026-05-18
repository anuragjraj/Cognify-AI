import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cognify_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("cognify_token");
      localStorage.removeItem("cognify_user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (name, email, password) => api.post("/auth/register", { name, email, password }),
  login:    (email, password)       => api.post("/auth/login",    { email, password }),
  google:   (credential)            => api.post("/auth/google",   { credential }),
  me:       ()                      => api.get("/auth/me"),
};

export const coursesAPI = {
  list:         ()           => api.get("/courses"),
  get:          (id)         => api.get(`/courses/${id}`),
  create:       (topic)      => api.post("/courses", { topic }),
  updateModule: (cId, mId, data) => api.patch(`/courses/${cId}/modules/${mId}`, data),
  retryModule:  (cId, mId)   => api.post(`/courses/${cId}/modules/${mId}/retry`),
  update:       (id, data)   => api.patch(`/courses/${id}`, data),
  finalQuiz:    (id)         => api.post(`/courses/${id}/final-quiz`),
  delete:       (id)         => api.delete(`/courses/${id}`),
  stream:       (courseId)   => {
    const token = localStorage.getItem("cognify_token");
    return new EventSource(`${import.meta.env.VITE_API_URL || "/api"}/courses/${courseId}/stream?token=${token}`);
  },
};

export const videosAPI = {
  list:   ()         => api.get("/videos"),
  get:    (id)       => api.get(`/videos/${id}`),
  save:   (videoId, title) => api.post("/videos", { videoId, title }),
  update: (id, data) => api.patch(`/videos/${id}`, data),
  delete: (id)       => api.delete(`/videos/${id}`),
};

export const searchAPI = {
  videos:     (q, n = 4)  => api.get(`/search?q=${encodeURIComponent(q)}&n=${n}`),
  transcript: (videoId)   => api.get(`/search/transcript/${videoId}`),
  info:       (videoId)   => api.get(`/search/info/${videoId}`),
};

export const chatAPI = {
  send: (messages, ctx) => api.post("/chat", { messages, ...ctx }),
};

export const billingAPI = {
  createSubscription: (plan) => api.post("/billing/create-subscription", { plan }),
  verify:           (data)   => api.post("/billing/verify", data),
  cancel:           ()       => api.post("/billing/cancel"),
  
  status:         ()       => api.get("/billing/status"),
};

export default api;
