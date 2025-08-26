/**
 * HLS Video Processing Service
 * 
 * Generates HLS streams from video files using direct FFmpeg commands for Instagram-style fast video playback.
 * Handles video processing, chunking, and S3 upload of HLS segments.
 * 
 * Replaced deprecated fluent-ffmpeg with direct FFmpeg execution for better reliability and performance.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { S3Service } from '../storage/S3Service';

function getFfmpegPaths(): { ffmpeg: string; ffprobe: string } {
  try {
    const { execSync } = require('child_process');
    const systemFfmpeg = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
    const systemFfprobe = execSync('which ffprobe', { encoding: 'utf8' }).trim();
    if (systemFfmpeg && systemFfprobe) {
      console.log('Using system FFmpeg:', systemFfmpeg);
      console.log('Using system FFprobe:', systemFfprobe);
      return { ffmpeg: systemFfmpeg, ffprobe: systemFfprobe };
    }
  } catch (error) {
    console.log('System FFmpeg/FFprobe not found, trying ffmpeg-static');
  }

  try {
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic) {
      console.log('FFmpeg path configured from ffmpeg-static:', ffmpegStatic);
      try {
        const { execSync } = require('child_process');
        const systemFfprobe = execSync('which ffprobe', { encoding: 'utf8' }).trim();
        return { ffmpeg: ffmpegStatic, ffprobe: systemFfprobe };
      } catch {
        const path = require('path');
        const ffprobeStatic = path.join(path.dirname(ffmpegStatic), 'ffprobe');
        return { ffmpeg: ffmpegStatic, ffprobe: ffprobeStatic };
      }
    }
  } catch (error) {
    console.error('Failed to load ffmpeg-static:', error);
  }

  throw new Error('FFmpeg/FFprobe not found. Please install FFmpeg or ensure ffmpeg-static is properly configured.');
}

const ffmpegPaths = getFfmpegPaths();

export interface HLSProcessingOptions {
  guestName: string;
  videoId?: string;
  segmentDuration?: number;
  quality?: 'low' | 'medium' | 'high';
}

export interface HLSProcessingResult {
  videoId: string;
  originalPath: string;
  hlsPath: string;
  playlistUrl: string;
  segmentUrls: string[];
  duration: number;
}

interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  bitrate: string;
}

export class HLSVideoProcessor {
  private s3Service: S3Service;
  private tempDir: string;

  constructor() {
    this.s3Service = new S3Service();
    this.tempDir = path.join(process.cwd(), 'temp');
  }

  /**
   * Process a video file and generate HLS output
   */
  async processVideoToHLS(
    videoBuffer: Buffer,
    originalFileName: string,
    options: HLSProcessingOptions
  ): Promise<HLSProcessingResult> {
    const videoId = options.videoId || randomUUID();
    const sanitizedGuestName = this.sanitizeGuestName(options.guestName);
    
    console.log(`[HLS] Starting video processing for ${originalFileName} (ID: ${videoId})`);
    
    await this.ensureTempDirectory();
    
    const tempVideoPath = path.join(this.tempDir, `${videoId}_input.mp4`);
    const tempOutputDir = path.join(this.tempDir, `${videoId}_hls`);
    
    try {
      console.log(`[HLS] Writing video buffer to ${tempVideoPath}`);
      await fs.writeFile(tempVideoPath, videoBuffer);
      
      console.log(`[HLS] Creating output directory ${tempOutputDir}`);
      await fs.mkdir(tempOutputDir, { recursive: true });
      
      console.log(`[HLS] Getting video information`);
      const videoInfo = await this.getVideoInfo(tempVideoPath);
      console.log(`[HLS] Video info: ${videoInfo.width}x${videoInfo.height}, duration: ${videoInfo.duration}s`);
      
      console.log(`[HLS] Generating HLS segments`);
      await this.generateHLS(tempVideoPath, tempOutputDir, options);
      console.log(`[HLS] HLS generation completed`);
      
      console.log(`[HLS] Uploading original video to S3`);
      const originalS3Key = `wedding/${sanitizedGuestName}/originals/${videoId}.mp4`;
      await this.s3Service.uploadFile(videoBuffer, originalS3Key, 'video/mp4');
      
      console.log(`[HLS] Uploading HLS files to S3`);
      const hlsS3Key = `wedding/${sanitizedGuestName}/hls/${videoId}`;
      const segmentUrls = await this.uploadHLSToS3(tempOutputDir, hlsS3Key);
      console.log(`[HLS] Uploaded ${segmentUrls.length} HLS segments`);
      
      const playlistUrl = `/api/s3-proxy/${hlsS3Key}/index.m3u8`;
      const originalPath = `${originalS3Key}`;
      
      console.log(`[HLS] Generated playlist URL: ${playlistUrl}`);
      
      console.log(`[HLS] Cleaning up temp files`);
      await this.cleanup(tempVideoPath, tempOutputDir);
      
      console.log(`[HLS] Video processing completed successfully for ${videoId}`);
      return {
        videoId,
        originalPath,
        hlsPath: hlsS3Key,
        playlistUrl,
        segmentUrls,
        duration: videoInfo.duration
      };
      
    } catch (error) {
      console.error(`[HLS] Error processing video ${videoId}:`, error);
      await this.cleanup(tempVideoPath, tempOutputDir);
      throw new Error(`HLS processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get video information using FFprobe
   */
  private async getVideoInfo(inputPath: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const ffprobeArgs = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        inputPath
      ];

      console.log(`[HLS] Running FFprobe: ${ffmpegPaths.ffprobe} ${ffprobeArgs.join(' ')}`);
      const ffprobe = spawn(ffmpegPaths.ffprobe, ffprobeArgs);
      let stdout = '';
      let stderr = '';
      let isResolved = false;

      // Set timeout to prevent hanging (30 seconds max)
      const timeout = setTimeout(() => {
        if (!isResolved) {
          console.error('[HLS] FFprobe timeout - killing process');
          ffprobe.kill('SIGKILL');
          reject(new Error('FFprobe process timed out after 30 seconds'));
          isResolved = true;
        }
      }, 30 * 1000);

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (isResolved) return;
        clearTimeout(timeout);
        isResolved = true;
        
        console.log(`[HLS] FFprobe completed with code ${code}`);
        if (code !== 0) {
          console.error(`[HLS] FFprobe stderr: ${stderr}`);
          reject(new Error(`FFprobe failed with code ${code}: ${stderr}`));
          return;
        }

        try {
          const info = JSON.parse(stdout);
          const videoStream = info.streams.find((stream: any) => stream.codec_type === 'video');
          
          if (!videoStream) {
            reject(new Error('No video stream found'));
            return;
          }

          resolve({
            duration: parseFloat(info.format.duration) || 0,
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            bitrate: info.format.bit_rate || '0'
          });
        } catch (parseError) {
          console.error(`[HLS] Failed to parse FFprobe output: ${parseError}`);
          reject(new Error(`Failed to parse video info: ${parseError}`));
        }
      });

      ffprobe.on('error', (error) => {
        if (isResolved) return;
        clearTimeout(timeout);
        isResolved = true;
        
        console.error(`[HLS] FFprobe spawn error: ${error.message}`);
        reject(new Error(`FFprobe spawn error: ${error.message}`));
      });
    });
  }

  /**
   * Generate HLS using direct FFmpeg command
   */
  private async generateHLS(
    inputPath: string, 
    outputDir: string, 
    options: HLSProcessingOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const segmentDuration = options.segmentDuration || 6; // 6-second segments for fast seeking
      const playlistPath = path.join(outputDir, 'index.m3u8');
      
      // Quality settings
      const qualitySettings = this.getQualitySettings(options.quality || 'medium');
      
      const ffmpegArgs = [
        '-i', inputPath,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', qualitySettings.crf.toString(),
        '-maxrate', qualitySettings.maxrate,
        '-bufsize', qualitySettings.bufsize,
        '-c:a', 'aac',
        '-ar', '44100',
        '-b:a', '128k',
        '-f', 'hls',
        '-hls_time', segmentDuration.toString(),
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', path.join(outputDir, 'chunk%d.ts'),
        '-hls_flags', 'independent_segments',
        '-y', // Overwrite output files
        playlistPath
      ];
      
      console.log(`[HLS] Running FFmpeg: ${ffmpegPaths.ffmpeg} ${ffmpegArgs.join(' ')}`);
      const ffmpeg = spawn(ffmpegPaths.ffmpeg, ffmpegArgs);
      let stderr = '';
      let isResolved = false;

      // Set timeout to prevent hanging (5 minutes max)
      const timeout = setTimeout(() => {
        if (!isResolved) {
          console.error('[HLS] FFmpeg timeout - killing process');
          ffmpeg.kill('SIGKILL');
          reject(new Error('FFmpeg process timed out after 5 minutes'));
          isResolved = true;
        }
      }, 5 * 60 * 1000);

      ffmpeg.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        // Log FFmpeg progress (FFmpeg writes progress info to stderr)
        if (chunk.includes('time=')) {
          console.log(`[HLS] FFmpeg progress: ${chunk.trim()}`);
        }
      });

      ffmpeg.on('close', (code) => {
        if (isResolved) return;
        clearTimeout(timeout);
        isResolved = true;
        
        console.log(`[HLS] FFmpeg completed with code ${code}`);
        if (code !== 0) {
          console.error(`[HLS] FFmpeg stderr: ${stderr}`);
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
          return;
        }
        resolve();
      });

      ffmpeg.on('error', (error) => {
        if (isResolved) return;
        clearTimeout(timeout);
        isResolved = true;
        
        console.error(`[HLS] FFmpeg spawn error: ${error.message}`);
        reject(new Error(`FFmpeg spawn error: ${error.message}`));
      });
    });
  }

  /**
   * Upload HLS files to S3
   */
  private async uploadHLSToS3(hlsDir: string, s3KeyPrefix: string): Promise<string[]> {
    const files = await fs.readdir(hlsDir);
    const segmentUrls: string[] = [];
    
    for (const file of files) {
      const filePath = path.join(hlsDir, file);
      let fileBuffer = await fs.readFile(filePath);
      const s3Key = `${s3KeyPrefix}/${file}`;
      
      // Determine content type
      const contentType = file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t';
      
      // If this is the playlist file, modify it to use proxy URLs for segments
      if (file.endsWith('.m3u8')) {
        let playlistContent = fileBuffer.toString('utf8');
        
        // Replace relative segment paths with absolute proxy URLs
        // Look for .ts file references and replace them
        playlistContent = playlistContent.replace(/chunk(\d+)\.ts/g, `/api/s3-proxy/${s3KeyPrefix}/chunk$1.ts`);
        
        console.log(`[HLS] Modified playlist content with proxy URLs`);
        fileBuffer = Buffer.from(playlistContent, 'utf8');
      }
      
      await this.s3Service.uploadFile(fileBuffer, s3Key, contentType);
      
      if (file.endsWith('.ts')) {
        const segmentUrl = `/api/s3-proxy/${s3Key}`;
        segmentUrls.push(segmentUrl);
      }
    }
    
    return segmentUrls;
  }

  /**
   * Get quality settings based on quality level
   */
  private getQualitySettings(quality: 'low' | 'medium' | 'high') {
    switch (quality) {
      case 'low':
        return { crf: 28, maxrate: '500k', bufsize: '1000k' };
      case 'medium':
        return { crf: 23, maxrate: '1500k', bufsize: '3000k' };
      case 'high':
        return { crf: 18, maxrate: '3000k', bufsize: '6000k' };
      default:
        return { crf: 23, maxrate: '1500k', bufsize: '3000k' };
    }
  }

  /**
   * Sanitize guest name for file paths
   */
  private sanitizeGuestName(guestName: string): string {
    return guestName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Ensure temp directory exists
   */
  private async ensureTempDirectory(): Promise<void> {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanup(videoPath?: string, outputDir?: string): Promise<void> {
    try {
      if (videoPath) {
        await fs.unlink(videoPath).catch(() => {});
      }
      if (outputDir) {
        await fs.rm(outputDir, { recursive: true, force: true }).catch(() => {});
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Get HLS playlist URL for a video
   */
  async getHLSPlaylistUrl(guestName: string, videoId: string): Promise<string> {
    const sanitizedGuestName = this.sanitizeGuestName(guestName);
    const s3Key = `wedding/${sanitizedGuestName}/hls/${videoId}/index.m3u8`;
    return `/api/s3-proxy/${s3Key}`;
  }

  /**
   * Check if HLS version exists for a video
   */
  async hasHLSVersion(guestName: string, videoId: string): Promise<boolean> {
    const sanitizedGuestName = this.sanitizeGuestName(guestName);
    const s3Key = `wedding/${sanitizedGuestName}/hls/${videoId}/index.m3u8`;
    
    try {
      await this.s3Service.getFileMetadata(s3Key);
      return true;
    } catch {
      return false;
    }
  }
}