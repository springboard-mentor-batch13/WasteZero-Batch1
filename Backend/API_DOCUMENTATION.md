# WasteZero Profile APIs

Base URL

```
http://localhost:5000
```

---

# Register

POST

```
/api/auth/register
```

Body

```json
{
    "name":"Ram",
    "email":"ram@gmail.com",
    "password":"123456"
}
```

---

# Login

POST

```
/api/auth/login
```

Body

```json
{
    "email":"ram@gmail.com",
    "password":"123456"
}
```

Response

```json
{
   "token":"JWT_TOKEN"
}
```

---

# Get Profile

GET

```
/api/profile
```

Header

```
Authorization : Bearer JWT_TOKEN
```

---

# Update Profile

PUT

```
/api/profile
```

Header

```
Authorization : Bearer JWT_TOKEN
```

Example Body

```json
{
    "phone":"9876543210",
    "location":"Hyderabad",
    "bio":"Backend Developer"
}
```

---

# Change Password

PUT

```
/api/profile/password
```

Body

```json
{
    "oldPassword":"123456",
    "newPassword":"12345678"
}
```

---

# Upload Profile Image

POST

```
/api/profile/upload
```

Body

```
form-data
```

Key

```
profileImage
```

Type

```
File
```

---

# Delete Account

DELETE

```
/api/profile
```

Header

```
Authorization : Bearer JWT_TOKEN
```