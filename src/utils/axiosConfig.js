import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

// 🟢 REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 🚨 GLOBAL HARD CACHE BUSTING
        config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        config.headers['Pragma'] = 'no-cache';
        config.headers['Expires'] = '0';

        // HARD QUERY CACHE KILLER (Android/CDN safe)
        config.params = {
            ...(config.params || {}),
            _t: Date.now(),
        };

        console.log(
            '%c🟢 [API REQUEST]',
            'color: green; font-weight: bold;',
            {
                url: config.url,
                method: config.method,
                headers: config.headers,
                params: config.params,
                data: config.data,
            }
        );

        return config;
    },
    error => Promise.reject(error)
);

// 🟢 RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
    (response) => {
        console.log(
            "%c🟣 [API RESPONSE]",
            'color: green; font-weight: bold;',
            {
                url: response?.config?.url,
                method: response?.config?.method,
                status: response?.status,
                data: response?.data,
            }
        );
        return response;
    },
    (error) => {
        console.log(
            '%c🔴 [API ERROR]',
            'color: red; font-weight: bold;',
            error?.response || error?.message
        );
        return Promise.reject(error);
    }
);

export default axiosInstance;
