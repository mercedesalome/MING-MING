import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main app
    router.push('/app');
  }, [router]);

  return (
    <>
      <Head>
        <title>Ming Ming - Fashion Marketplace</title>
        <meta name="description" content="Buy and sell fashion items with Ming Ming" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ 
            fontSize: '2rem', 
            marginBottom: '1rem',
            color: '#333'
          }}>
            Ming Ming App
          </h1>
          <p style={{ 
            color: '#666',
            marginBottom: '1rem'
          }}>
            Fashion Marketplace - Buy & Sell with Confidence
          </p>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007AFF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ 
            color: '#999',
            marginTop: '1rem',
            fontSize: '0.9rem'
          }}>
            Loading your app...
          </p>
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
