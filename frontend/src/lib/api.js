import { axiosInstance } from "./axios";

export const getStreamToken = async () => {
  const { data } = await axiosInstance.get("/chat/token");
  return data;
};
