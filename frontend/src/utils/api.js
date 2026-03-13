import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "";

const API = axios.create({ baseURL: `${BASE_URL}/api` });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("da_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("da_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Discount / ML ─────────────────────────────────────────────
export const simulateDiscount = (productId, price, category, discount) =>
  API.post("/simulate-discount", { product_id: String(productId), price, category, discount });

export const getDiscountAdvice = (productId, price, category) =>
  API.get(`/discount-advice-direct?productId=${productId}&price=${price}&category=${encodeURIComponent(category)}`);

// ── User uploaded products ────────────────────────────────────
export const getUserProducts = () =>
  API.get("/user-products");

export const saveUserProducts = (products) =>
  API.post("/user-products/bulk", { products });

export const deleteUserProduct = (id) =>
  API.delete(`/user-products/${id}`);

export const clearUserProducts = () =>
  API.delete("/user-products");

// ── DummyJSON (free, no auth) ─────────────────────────────────
const DUMMY = axios.create({ baseURL: "https://dummyjson.com" });

export const getProducts = (limit = 100) =>
  DUMMY.get(`/products?limit=${limit}&select=id,title,price,discountPercentage,rating,stock,category,thumbnail,brand`);

export const getProduct = (id) =>
  DUMMY.get(`/products/${id}`);

export const getCategories = () =>
  DUMMY.get("/products/categories");

export const getProductsByCategory = (category) =>
  DUMMY.get(`/products/category/${category}?select=id,title,price,discountPercentage,rating,stock,thumbnail,brand`);

export const searchProducts = (q) =>
  DUMMY.get(`/products/search?q=${q}&select=id,title,price,discountPercentage,category,thumbnail`);

export default API;
