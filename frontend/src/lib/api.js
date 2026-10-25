import { axiosInstance } from "./axios";

export const getStreamToken = async () => {
  const { data } = await axiosInstance.get("/chat/token");
  return data;
};

export const createChannel = async ({ name, description, isPrivate, memberIds }) => {
  const { data } = await axiosInstance.post("/channels", { name, description, isPrivate, memberIds });
  return data.channel;
};

export const getPublicChannels = async () => {
  const { data } = await axiosInstance.get("/channels/public");
  return data.channels;
};

export const joinChannel = async (channelId) => {
  const { data } = await axiosInstance.post(`/channels/${encodeURIComponent(channelId)}/join`);
  return data.channel;
};

export const addChannelMembers = async (channelId, userIds) => {
  const { data } = await axiosInstance.post(`/channels/${encodeURIComponent(channelId)}/members`, { userIds });
  return data.added;
};

export const leaveChannel = async (channelId) => {
  const { data } = await axiosInstance.post(`/channels/${encodeURIComponent(channelId)}/leave`);
  return data;
};

// Server messages are written for users; fall back to a generic one for network errors
export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.response?.data?.message || fallback;
