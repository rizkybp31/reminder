const getFriendlyErrorMessage = (error: string) => {
  if (!error) return "";

  // Mapping berdasarkan pesan dari library auth atau backend
  if (
    error.includes("CredentialsSignin") ||
    error.includes("invalid-password")
  ) {
    return "Email atau password yang Anda masukkan salah.";
  }
  if (error.includes("User not found")) {
    return "Akun tidak terdaftar dalam sistem.";
  }
  if (error.includes("Too many requests") || error.includes("rate-limit")) {
    return "Terlalu banyak percobaan masuk. Silakan coba lagi nanti.";
  }
  if (error.includes("Network Error")) {
    return "Koneksi internet bermasalah. Periksa jaringan Anda.";
  }

  // Pesan default jika error tidak spesifik
  return "Terjadi kesalahan sistem. Silakan hubungi admin.";
};

export default getFriendlyErrorMessage;
