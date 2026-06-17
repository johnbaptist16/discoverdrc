import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width: SCREEN_W } = Dimensions.get('window');
const VIDEO_H = Math.round(SCREEN_W * 9 / 16); // 16:9

interface Props {
  videoUrl: string;
  title?: string;
  description?: string;
  price?: string | null;
  currency?: string;
}

export function VideoCard({ videoUrl, title, description, price, currency }: Props) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef(null);

  const player = useVideoPlayer(videoUrl, p => {
    p.loop = false;
  });

  function toggle() {
    if (playing) {
      player.pause();
    } else {
      player.play();
    }
    setPlaying(v => !v);
  }

  return (
    <View style={s.wrap}>
      <View style={s.videoWrap}>
        <VideoView
          ref={ref}
          player={player}
          style={s.video}
          allowsPictureInPicture
          contentFit="contain"
        />
        {!playing && (
          <TouchableOpacity style={s.playOverlay} onPress={toggle} activeOpacity={0.85}>
            <View style={s.playBtn}>
              <Text style={s.playIcon}>▶</Text>
            </View>
          </TouchableOpacity>
        )}
        {playing && (
          <TouchableOpacity style={s.pauseHit} onPress={toggle} activeOpacity={0.6} />
        )}
      </View>

      {(title || price) && (
        <View style={s.meta}>
          {title && <Text style={s.title} numberOfLines={2}>{title}</Text>}
          {description && <Text style={s.desc} numberOfLines={2}>{description}</Text>}
          {price && (
            <Text style={s.price}>
              {Number(price).toLocaleString('fr-CD')} {currency ?? 'CDF'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:        { backgroundColor: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  videoWrap:   { width: '100%', height: VIDEO_H, position: 'relative' },
  video:       { width: '100%', height: '100%' },
  playOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  playBtn:     { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  playIcon:    { fontSize: 26, color: '#111', marginLeft: 4 },
  pauseHit:    { ...StyleSheet.absoluteFill },
  meta:        { padding: 12, gap: 4 },
  title:       { fontSize: 15, fontWeight: '700', color: '#fff' },
  desc:        { fontSize: 13, color: '#bbb', lineHeight: 18 },
  price:       { fontSize: 15, fontWeight: '800', color: '#25D366' },
});
