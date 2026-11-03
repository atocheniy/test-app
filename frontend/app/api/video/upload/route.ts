import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const MAX_VIDEO_SIZE_BYTES = 30 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const cookieStore = await cookies();
        const cookieToken = cookieStore.get('token')?.value;
        const authHeader = request.headers.get('authorization');
        const bearerToken = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

        if (!bearerToken) {
          throw new Error('Unauthorized');
        }

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5223/api';
        const authRes = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
          cache: 'no-store',
        });

        if (!authRes.ok) {
          throw new Error('Unauthorized');
        }

        return {
          allowedContentTypes: [
            'video/mp4',
            'video/webm',
            'video/ogg',
            'video/quicktime',
            'video/x-m4v',
          ],
          maximumSizeInBytes: MAX_VIDEO_SIZE_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Видео успешно загружено в облако:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = (error as Error).message;
    console.error('Ошибка в video upload API:', error);
    return NextResponse.json(
      { error: message },
      { status: message === 'Unauthorized' ? 401 : 400 }
    );
  }
}
