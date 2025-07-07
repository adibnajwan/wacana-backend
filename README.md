# 📚 Wacana API - Backend Service

RESTful API backend untuk platform **Wacana**, dibangun menggunakan [Hapi.js](https://hapi.dev/) dan dideploy menggunakan **Google Cloud App Engine**.

🌐 **Base URL**: [`https://proyekpemrog.et.r.appspot.com/api/v1`](https://proyekpemrog.et.r.appspot.com/api/v1)

---

## 🚀 Daftar Endpoint API

### ✅ `GET /`
Cek apakah server aktif.

**Response:**
```json
{
  "status": "success",
  "message": "Berhasil"
}
