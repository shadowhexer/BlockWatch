<template>
  <!-- Logo Section Outside the Dashboard -->
  <div class="logo-container">
    <img src="@/assets/logo.png" alt="logo" class="logo" />
    <img src="@/assets/buenavista.png" alt="logo" class="logo" />
    <img src="@/assets/mahay.png" alt="logo" class="logo" />
  </div>

  <!-- Main Login Container -->
  <div class="container">
    <h2>👮 Tanod Login</h2>

    <div class="form">
      <input v-model="username" placeholder="Username" />
      <input v-model="password" placeholder="Password" type="password" />

      <button @click="login">Login</button>

      <p class="message" v-if="message">{{ message }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: '',
      message: ''
    };
  },
  methods: {
    async login() {
      if (!this.username || !this.password) {
        this.message = 'Please enter username and password';
        return;
      }
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.username, password: this.password }),
      });
      const data = await res.json();
      if (data.message === 'Login successful') {
        this.message = '';
        // Redirect to TanodInterface with username as a query parameter
        this.$router.push({ name: 'tanod-interface', query: { user: this.username } });
      } else {
        this.message = data.error || 'Login failed';
      }
    }
  }
};
</script>

<style scoped>
/* Logos Container Outside of the Main Login Container */
.logo-container {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  margin-bottom: 30px; /* Adjust space between logos and the form */
}

.logo {
  width: 100px;
  height: auto;
}

.container {
  max-width: 320px;
  margin: 100px auto;
  padding: 30px 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: center;
  font-family: Arial, sans-serif;
  background-color: #fafafa;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

h2 {
  margin-bottom: 20px;
}

input {
  width: 100%;
  padding: 10px 8px;
  margin: 8px 0;
  box-sizing: border-box;
  border: 1px solid #bbb;
  border-radius: 4px;
  font-size: 14px;
}

button {
  width: 100%;
  padding: 10px 0;
  margin-top: 15px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #0056b3;
}

.message {
  color: red;
  margin-top: 12px;
  min-height: 18px;
}
</style>
