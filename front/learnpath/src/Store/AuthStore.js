// src/store/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userId: null,
  email: null,
  name: null,
  isLoggedIn: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.idToken = action.payload.idToken;
      state.email = action.payload.email;
      state.name = action.payload.name;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.idToken = null;
      state.email = null;
      state.name = null;
      state.isLoggedIn = false;
    },
  },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;
