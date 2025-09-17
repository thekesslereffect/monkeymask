import { NextRequest, NextResponse } from 'next/server';
import * as bananojs from '@bananocoin/bananojs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, signature, publicKey, origin } = body;
    
    // Validate required parameters
    if (!message || !signature || !publicKey) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters: message, signature, publicKey',
          valid: false 
        },
        { status: 400 }
      );
    }
    
    // Use origin from request headers if not provided
    const verificationOrigin = origin || request.headers.get('origin') || 'unknown';
    
    console.log('Server: Verifying signature for:', {
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      signature: signature.substring(0, 20) + '...',
      publicKey: publicKey.substring(0, 20) + '...',
      origin: verificationOrigin
    });
    
    try {
      // Build the same domain-separated message as the extension
      const messageToVerify = `MonkeyMask Signed Message:\nOrigin: ${verificationOrigin}\nMessage: ${message}`;
      console.log('Server: Message to verify:', messageToVerify);
      
      // Convert Banano address to hex public key if needed (like the extension does internally)
      let hexPublicKey = publicKey;
      if (publicKey.startsWith('ban_')) {
        console.log('Server: Converting Banano address to hex public key');
        try {
          // Use bananojs to convert address to hex public key
          hexPublicKey = bananojs.BananoUtil.getAccountPublicKey(publicKey);
          console.log('Server: Converted to hex public key:', hexPublicKey.substring(0, 20) + '...');
        } catch (conversionError) {
          console.error('Server: Failed to convert Banano address:', conversionError);
          throw new Error('Invalid Banano address format');
        }
      } else {
        console.log('Server: Using provided hex public key:', hexPublicKey.substring(0, 20) + '...');
      }
      
      // Use BananoUtil.verifyMessage exactly like the extension does
      console.log('Server: Using BananoUtil.verifyMessage like extension');
      const isValid = bananojs.BananoUtil.verifyMessage(hexPublicKey, messageToVerify, signature);
      console.log('Server: BananoUtil.verifyMessage result:', isValid);
      
      return NextResponse.json({
        valid: isValid,
        message: isValid ? 'Signature verified successfully' : 'Signature verification failed',
        verifiedAt: new Date().toISOString()
      });
      
    } catch (verifyError) {
      console.error('Server: BananoUtil.verifyMessage error:', verifyError);
      return NextResponse.json({
        valid: false,
        message: 'Signature verification failed',
        error: verifyError instanceof Error ? verifyError.message : 'Unknown verification error'
      });
    }
    
  } catch (error) {
    console.error('Server: API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        valid: false 
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET method for health check
export async function GET() {
  return NextResponse.json({
    service: 'MonkeyMask Signature Verification',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    bananojs_version: bananojs.BananoUtil ? 'available' : 'unavailable'
  });
}
