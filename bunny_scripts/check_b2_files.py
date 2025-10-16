"""
B2'deki dosyaları listele ve kontrol et
"""

from b2sdk.v2 import B2Api, InMemoryAccountInfo

# B2 Configuration
B2_KEY_ID = "0031108d4b36d830000000003"
B2_APP_KEY = "K003la4MIw5V+KDsvjFi+yfk0O0DK9E"
B2_BUCKET_NAME = "kudopy"

# B2 API
info = InMemoryAccountInfo()
b2_api = B2Api(info)
b2_api.authorize_account("production", B2_KEY_ID, B2_APP_KEY)
bucket = b2_api.get_bucket_by_name(B2_BUCKET_NAME)

print(f"✅ B2 bağlantısı başarılı: {B2_BUCKET_NAME}\n")

# Dosyaları listele
print("📂 B2'deki dosyalar:\n")

file_count = 0
total_size = 0

for file_version, folder_name in bucket.ls(recursive=True):
    if file_version is not None:
        file_count += 1
        size_mb = file_version.size / (1024 * 1024)
        total_size += file_version.size
        
        print(f"📄 {file_version.file_name}")
        print(f"   Boyut: {size_mb:.2f} MB")
        print(f"   Tarih: {file_version.upload_timestamp}")
        print()

print("-" * 60)
print(f"Toplam: {file_count} dosya, {total_size / (1024*1024):.2f} MB")

# One Piece dosyalarını ara
print("\n" + "=" * 60)
print("🔍 'One Piece' dosyaları:")
print("=" * 60)

for file_version, folder_name in bucket.ls(recursive=True):
    if file_version is not None and "One Piece" in file_version.file_name:
        print(f"✅ {file_version.file_name} ({file_version.size / (1024*1024):.2f} MB)")
