import React from 'react'

interface VideoPlayerProps {
  videoUrl: string | null
  lessonTitle: string
}

export default function VideoPlayer({ videoUrl, lessonTitle }: VideoPlayerProps) {
  return (
    <div
      style={{
        borderRadius: '10px',
        overflow: 'hidden',
        aspectRatio: '16 / 9',
        backgroundColor: 'var(--ink)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          title={lessonTitle}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at center, rgba(184,146,42,0.12) 0%, var(--ink) 70%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Lesson Preview label */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--gold)',
              marginBottom: '16px',
              fontWeight: 500,
            }}
          >
            Lesson Preview
          </p>
          {/* Play button circle */}
          <div
            style={{
              width: '56px',
              height: '56px',
              border: '1.5px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '20px',
                paddingLeft: '3px',
                lineHeight: 1,
              }}
            >
              ▶
            </span>
          </div>
          {/* Placeholder note */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.2)',
              marginTop: '12px',
              letterSpacing: '0.06em',
            }}
          >
            // TODO: Add video URL
          </p>
        </div>
      )}
    </div>
  )
}
