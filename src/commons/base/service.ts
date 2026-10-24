"use client"
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

// 定义统一的API响应格式
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
  [key: string]: any;
}

// 扩展 axios 实例以支持泛型
interface CustomAxiosInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
}

const service = axios.create({
    baseURL:"/server",
    timeout: 20000, // 超时时间
    withCredentials: true,
    withXSRFToken: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    headers: {
        'Content-Type': 'application/json',
    },
}) as CustomAxiosInstance & typeof axios;

// 请求拦截器
service.interceptors.request.use(
    (config) => config,
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
service.interceptors.response.use(
    (response) => {
        const res = response.data;
        if (!res || typeof res.code !== 'number') {
            return res;
        }
        if (res.code === 10002) {
            message.error(res.message);
        } else if (res.code === -1 && window.location.pathname !== '/init') {
            message.error(res.message || '项目未初始化');
            setTimeout(() => {
                window.location.href='/init';
            }, 3000);
            return new Promise(() => {});
        } else if (res.code !== 200) {
            message.error(res.message || '操作失败');
            return Promise.reject(new Error(res.message || '操作失败'));
        }
        return res;
    },
    (error) => {
        const status = error?.response?.status;
        if (status === 403) {
            message.error('当前账号没有执行此操作的权限');
        } else if (status !== 401) {
            message.error('网络请求失败');
        }
        return Promise.reject(error);
    }
);

export default service;
