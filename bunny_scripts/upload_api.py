"""
Anime Upload API - Bunny.net Entegrasyonu
Fansub ve adminler için anime yükleme sistemi
"""

from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import sys
from pathlib import Path
import tempfile
from werkzeug.utils import secure_filename
import json
from datetime import datetime
import time

# turkanime_to_bunny modülünü import et
from turkanime_to_bunny import BunnyUploader

app = Flask(__name__)
CORS(app)

# Konfigürasyon
UPLOAD_FOLDER = Path('temp_uploads')
UPLOAD_FOLDER.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {'mp4', 'mkv', 'avi', 'mov', 'webm'}
MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5GB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Bunny.net API
BUNNY_API_KEY = os.getenv('BUNNY_STREAM_API_KEY')
BUNNY_LIBRARY_ID = os.getenv('BUNNY_LIBRARY_ID')

if not BUNNY_API_KEY or not BUNNY_LIBRARY_ID:
    print("⚠️ UYARI: Bunny.net API bilgileri ayarlanmamış!")
    print("Environment variables: BUNNY_STREAM_API_KEY, BUNNY_LIBRARY_ID")

bunny = BunnyUploader(BUNNY_API_KEY, BUNNY_LIBRARY_ID) if BUNNY_API_KEY else None

# Upload log
UPLOAD_LOG = Path('upload_history.json')


def allowed_file(filename):
    """Dosya uzantısı kontrolü"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def log_upload(data):
    """Upload geçmişini logla"""
    try:
        history = []
        if UPLOAD_LOG.exists():
            with open(UPLOAD_LOG, 'r', encoding='utf-8') as f:
                history = json.load(f)
        
        history.append({
            **data,
            'timestamp': datetime.now().isoformat()
        })
        
        with open(UPLOAD_LOG, 'w', encoding='utf-8') as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Log hatası: {e}")


@app.route('/')
def index():
    """Ana sayfa"""
    return render_template('upload.html')


@app.route('/api/anime/list', methods=['GET'])
def get_anime_list():
    """TurkAnime'den anime listesini getir"""
    try:
        import turkanime as ta
        anime_list = ta.Anime.get_anime_listesi()
        
        return jsonify({
            'success': True,
            'anime': [
                {
                    'slug': slug,
                    'title': title
                }
                for slug, title in anime_list
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/collections', methods=['GET'])
def get_collections():
    """Mevcut collection'ları listele"""
    try:
        if not bunny:
            return jsonify({'error': 'Bunny.net API yapılandırılmamış'}), 500
        
        collections = bunny.list_collections()
        return jsonify({
            'success': True,
            'collections': [
                {
                    'id': c.get('guid'),
                    'name': c.get('name'),
                    'videoCount': c.get('videoCount', 0)
                }
                for c in collections
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/resolve-url', methods=['POST'])
def resolve_video_url():
    """Video URL'sini çözümle (yt-dlp ile)"""
    try:
        data = request.get_json()
        video_url = data.get('video_url')
        
        if not video_url:
            return jsonify({'error': 'video_url gerekli'}), 400
        
        print(f"🔍 URL çözümleniyor: {video_url}")
        
        # yt-dlp ile gerçek URL'yi al
        from yt_dlp import YoutubeDL
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'format': 'best',
        }
        
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            direct_url = info.get('url')
            
            if not direct_url:
                return jsonify({
                    'success': False,
                    'error': 'Direkt video URL\'si bulunamadı'
                }), 400
            
            print(f"✅ Gerçek URL bulundu: {direct_url[:100]}...")
            
            return jsonify({
                'success': True,
                'original_url': video_url,
                'resolved_url': direct_url,
                'title': info.get('title', ''),
                'duration': info.get('duration', 0),
                'platform': info.get('extractor', 'unknown')
            })
            
    except Exception as e:
        print(f"❌ URL çözümleme hatası: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/upload/url', methods=['POST'])
def upload_from_url():
    """URL'den video yükle (Mail.ru, Sibnet, Google Drive vb.)"""
    try:
        data = request.get_json()
        
        # Validasyon
        required_fields = ['anime_name', 'episode_number', 'episode_title', 'video_url']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Eksik alan: {field}'}), 400
        
        anime_name = data['anime_name']
        episode_number = data['episode_number']
        episode_title = data['episode_title']
        video_url = data['video_url']
        fansub = data.get('fansub', 'Unknown')
        
        if not bunny:
            return jsonify({'error': 'Bunny.net API yapılandırılmamış'}), 500
        
        # Collection bul veya oluştur
        collection_id = bunny.get_or_create_collection(anime_name)
        
        # Video başlığı
        title = f"{anime_name} - Bölüm {episode_number}: {episode_title}"
        
        # URL'yi çözümle (yt-dlp ile)
        print(f"🔍 URL çözümleniyor: {video_url}")
        from yt_dlp import YoutubeDL
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'format': 'best',
        }
        
        video_info = None  # Video bilgilerini sakla
        
        try:
            with YoutubeDL(ydl_opts) as ydl:
                print(f"  ⏳ yt-dlp ile bilgi çekiliyor...")
                info = ydl.extract_info(video_url, download=False)
                video_info = info  # Daha sonra kullanmak için sakla
                
                print(f"  📊 Video bilgileri:")
                print(f"     - Başlık: {info.get('title', 'N/A')}")
                print(f"     - Süre: {info.get('duration', 0)} saniye")
                print(f"     - Format: {info.get('format', 'N/A')}")
                print(f"     - Extractor: {info.get('extractor', 'N/A')}")
                
                direct_url = info.get('url')
                
                if not direct_url:
                    print(f"  ❌ 'url' field'ı bulunamadı!")
                    print(f"  📋 Mevcut field'lar: {list(info.keys())}")
                    return jsonify({
                        'success': False,
                        'error': 'Direkt video URL\'si bulunamadı'
                    }), 400
                
                print(f"  ✅ Gerçek URL bulundu: {direct_url[:100]}...")
                print(f"  🔗 URL tipi: {type(direct_url)}")
                video_url = direct_url  # Çözümlenmiş URL'yi kullan
        except Exception as e:
            print(f"  ❌ URL çözümleme hatası: {e}")
            print(f"  📋 Hata detayı: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            print(f"  ℹ️ Orijinal URL ile devam ediliyor...")
        
        # Sibnet gibi platformlar için: İndir ve yükle
        # Bunny.net'in direkt fetch'i 403 veriyor
        is_sibnet = 'sibnet' in video_url.lower() or (video_info and video_info.get('extractor') == 'sibnet')
        
        if is_sibnet:
            print(f"  ⚠️ Sibnet tespit edildi, video indirilip yüklenecek...")
            print(f"  📥 Video indiriliyor (bu biraz zaman alabilir)...")
            
            # yt-dlp ile videoyu indir
            import tempfile
            import os
            
            temp_dir = os.path.join(os.path.dirname(__file__), 'temp_downloads')
            os.makedirs(temp_dir, exist_ok=True)
            
            temp_file = os.path.join(temp_dir, f"temp_{int(time.time())}.mp4")
            
            ydl_download_opts = {
                'quiet': False,
                'no_warnings': False,
                'outtmpl': temp_file,
                'format': 'best',
            }
            
            try:
                with YoutubeDL(ydl_download_opts) as ydl:
                    ydl.download([video_url])
                
                print(f"  ✅ Video indirildi: {temp_file}")
                print(f"  📤 Bunny.net'e yükleniyor...")
                
                # Dosyadan yükle
                result = bunny.upload_file_direct(
                    file_path=temp_file,
                    title=title,
                    collection_id=collection_id
                )
                
                # Geçici dosyayı sil
                try:
                    os.remove(temp_file)
                    print(f"  🗑️ Geçici dosya silindi")
                except:
                    pass
                    
            except Exception as e:
                print(f"  ❌ İndirme/yükleme hatası: {e}")
                return jsonify({
                    'success': False,
                    'error': f'Video indirilemedi: {str(e)}'
                }), 500
        else:
            # Diğer platformlar için direkt fetch
            result = bunny.upload_from_url(
                video_url=video_url,
                title=title,
                collection_id=collection_id
            )
        
        if result['success']:
            # Log kaydet
            log_upload({
                'type': 'url',
                'anime_name': anime_name,
                'episode_number': episode_number,
                'episode_title': episode_title,
                'video_url': video_url,
                'fansub': fansub,
                'video_id': result['video_id'],
                'collection_id': collection_id
            })
            
            return jsonify({
                'success': True,
                'video_id': result['video_id'],
                'collection_id': collection_id,
                'message': 'Video başarıyla yüklendi!'
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Bilinmeyen hata')
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/upload/file', methods=['POST'])
def upload_from_file():
    """Dosyadan video yükle (MP4, MKV vb.)"""
    try:
        # Form validasyonu
        if 'video_file' not in request.files:
            return jsonify({'error': 'Video dosyası bulunamadı'}), 400
        
        file = request.files['video_file']
        if file.filename == '':
            return jsonify({'error': 'Dosya seçilmedi'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': f'Geçersiz dosya formatı. İzin verilenler: {ALLOWED_EXTENSIONS}'}), 400
        
        # Form verileri
        anime_name = request.form.get('anime_name')
        episode_number = request.form.get('episode_number')
        episode_title = request.form.get('episode_title')
        fansub = request.form.get('fansub', 'Unknown')
        
        if not all([anime_name, episode_number, episode_title]):
            return jsonify({'error': 'Tüm alanları doldurun'}), 400
        
        if not bunny:
            return jsonify({'error': 'Bunny.net API yapılandırılmamış'}), 500
        
        # Dosyayı geçici olarak kaydet
        filename = secure_filename(file.filename)
        temp_path = UPLOAD_FOLDER / filename
        file.save(temp_path)
        
        try:
            # Collection bul veya oluştur
            collection_id = bunny.get_or_create_collection(anime_name)
            
            # Video başlığı
            title = f"{anime_name} - Bölüm {episode_number}: {episode_title}"
            
            # Bunny.net'e yükle
            result = bunny.upload_file_direct(
                file_path=str(temp_path),
                title=title,
                collection_id=collection_id
            )
            
            if result['success']:
                # Log kaydet
                log_upload({
                    'type': 'file',
                    'anime_name': anime_name,
                    'episode_number': episode_number,
                    'episode_title': episode_title,
                    'filename': filename,
                    'fansub': fansub,
                    'video_id': result['video_id'],
                    'collection_id': collection_id
                })
                
                return jsonify({
                    'success': True,
                    'video_id': result['video_id'],
                    'collection_id': collection_id,
                    'message': 'Video başarıyla yüklendi!'
                })
            else:
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Bilinmeyen hata')
                }), 500
        finally:
            # Geçici dosyayı sil
            if temp_path.exists():
                temp_path.unlink()
                
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/download-upload', methods=['POST'])
def download_and_upload():
    """Video'yu indir ve Bunny'e yükle (frontend için)"""
    try:
        data = request.get_json()
        
        video_url = data.get('video_url')
        title = data.get('title')
        collection_id = data.get('collection_id', '')
        library_id = data.get('library_id', BUNNY_LIBRARY_ID)
        api_key = data.get('api_key', BUNNY_API_KEY)
        
        if not video_url or not title:
            return jsonify({'error': 'video_url ve title gerekli'}), 400
        
        if not bunny:
            return jsonify({'error': 'Bunny.net API yapılandırılmamış'}), 500
        
        print(f"📥 Video indiriliyor: {video_url[:80]}...")
        print(f"📝 Başlık: {title}")
        print(f"📁 Collection ID: {collection_id or 'Yok'}")
        
        # yt-dlp ile videoyu indir
        import tempfile
        import os
        
        temp_dir = os.path.join(os.path.dirname(__file__), 'temp_downloads')
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_file = os.path.join(temp_dir, f"temp_{int(time.time())}.mp4")
        
        from yt_dlp import YoutubeDL
        
        ydl_opts = {
            'quiet': False,
            'no_warnings': False,
            'outtmpl': temp_file,
            'format': 'best',
        }
        
        try:
            with YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])
            
            print(f"✅ Video indirildi: {temp_file}")
            print(f"📤 Bunny.net'e yükleniyor...")
            
            # Dosyadan yükle
            result = bunny.upload_file_direct(
                file_path=temp_file,
                title=title,
                collection_id=collection_id
            )
            
            # Geçici dosyayı sil
            try:
                os.remove(temp_file)
                print(f"🗑️ Geçici dosya silindi")
            except:
                pass
            
            if result['success']:
                return jsonify({
                    'success': True,
                    'videoId': result['video_id'],
                    'collectionId': collection_id,
                    'embedUrl': f"https://iframe.mediadelivery.net/embed/{library_id}/{result['video_id']}"
                })
            else:
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Upload başarısız')
                }), 500
                
        except Exception as e:
            print(f"❌ İndirme/yükleme hatası: {e}")
            # Geçici dosyayı sil
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            except:
                pass
            
            return jsonify({
                'success': False,
                'error': f'Video indirilemedi: {str(e)}'
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/upload/history', methods=['GET'])
def get_upload_history():
    """Upload geçmişini getir"""
    try:
        if not UPLOAD_LOG.exists():
            return jsonify({'success': True, 'history': []})
        
        with open(UPLOAD_LOG, 'r', encoding='utf-8') as f:
            history = json.load(f)
        
        # Son 50 kayıt
        return jsonify({
            'success': True,
            'history': history[-50:][::-1]  # Ters sıra (en yeni üstte)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """API sağlık kontrolü"""
    return jsonify({
        'status': 'ok',
        'bunny_configured': bunny is not None,
        'upload_folder': str(UPLOAD_FOLDER),
        'max_file_size_mb': MAX_FILE_SIZE / (1024 * 1024)
    })


if __name__ == '__main__':
    print("=" * 60)
    print("🎬 Anime Upload API - Bunny.net")
    print("=" * 60)
    print(f"📁 Upload klasörü: {UPLOAD_FOLDER.absolute()}")
    print(f"📦 Max dosya boyutu: {MAX_FILE_SIZE / (1024**3):.1f} GB")
    print(f"🔑 Bunny.net: {'✅ Yapılandırıldı' if bunny else '❌ Yapılandırılmadı'}")
    print("=" * 60)
    print("\n🚀 Server başlatılıyor...")
    print("📍 URL: http://localhost:5000")
    print("\n⌨️  Durdurmak için: Ctrl+C\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
