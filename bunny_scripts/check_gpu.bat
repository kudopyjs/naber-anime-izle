@echo off
echo Checking NVIDIA GPU and FFmpeg support...
echo.

echo 1. Checking NVIDIA GPU:
nvidia-smi
echo.

echo 2. Checking FFmpeg NVENC support:
ffmpeg -encoders | findstr nvenc
echo.

echo 3. Testing hevc_nvenc:
ffmpeg -h encoder=hevc_nvenc
echo.

pause
