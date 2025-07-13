import {create} from "zustand";
import axios from "../lib/axios";
import {toast} from "react-hot-toast";

export const useUserStore = create((set, get) => ({

	user: null,
	loading: false,
	checkingAuth: true,

	signup: async ({ name, email, password, confirmPassword }) => {
		set({ loading: true });

		if (password !== confirmPassword) {
			set({ loading: false });
			return toast.error("Passwords do not match");
		}

		try {
			const res = await axios.post("/auth/signup", { name, email, password });
			set({ user: res.data, loading: false });
            return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.message || "An error occurred");
		}
	},
	login: async (email, password) => {
		set({ loading: true });

		try {
			const res = await axios.post("/auth/login", { email, password });
            console.log(res.data);
			set({ user: res.data });
			set({ loading: false });
            return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.message || "An error occurred");
		}
	},

	logout: async () => {
		try {
			const res = await axios.post("/auth/logout");
            // console.log(res);
			set({ user: null });
            // return res.data;
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},

    checkAuth: async () => {
        set({ checkingAuth: true });
        try{
            const response = await axios.get("/auth/profile");
            set({ user: response.data, checkingAuth: false });
        } catch(error) {
            set({ checkingAuth:false, user: null });
        }
    }
}))