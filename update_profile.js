const fs = require('fs');

let content = fs.readFileSync('/home/harsh/Aqualyn/aqualyn-mobile/src/screens/ProfileScreen.tsx', 'utf8');

// 1. Remove the "New Post" dashed block from the grid
const oldGridAdder = `<TouchableOpacity \n                onPress={() => setIsPostCreatorOpen(true)}\n                style={styles.dashedSquareGridPostAdderCardTrigger}\n              >\n                <Plus size={24} color="#64748b" />\n                <Text style={styles.dashedSquareGridPostAdderCapsLabel}>New Post</Text>\n              </TouchableOpacity>`;
content = content.replace(oldGridAdder, '');

// 2. Change Stories block to use circles
const oldStoriesList = `<TouchableOpacity \n              onPress={() => setIsCreatorOpen(true)}\n              style={styles.dashedStoryCreativeAdderCardTrigger}\n            >\n              <View style={styles.innerCircularPlusBadgeWrapper}>\n                <Plus size={22} color="#0057bd" />\n              </View>\n              <Text style={styles.dashedStoryCreativeAdderLabelText}>Add Story</Text>\n            </TouchableOpacity>\n\n            {myStories.map((story: any, i: number) => (\n              <TouchableOpacity \n                key={story.id} \n                onPress={() => setActiveStoryIndex(i)}\n                style={styles.storyThumbnailCardContainerFrame}\n              >\n                <Image source={{ uri: story.mediaUrl }} style={styles.storyMediaThumbnailNativeImg} />\n                <View style={styles.absoluteBottomFadedScrimOverlayGradient} />\n                <Text style={styles.storyTimestampAbsoluteMetaLabelText}>{story.timestamp}</Text>\n              </TouchableOpacity>\n            ))}`;

const newStoriesList = `<View style={{ alignItems: 'center', width: 72 }}>
              <TouchableOpacity 
                onPress={() => setIsCreatorOpen(true)}
                style={styles.dashedStoryCreativeAdderCardTrigger}
              >
                <Plus size={28} color="#0057bd" />
              </TouchableOpacity>
              <Text style={styles.dashedStoryCreativeAdderLabelText}>Add Story</Text>
            </View>

            {myStories.map((story: any, i: number) => (
              <View key={story.id} style={{ alignItems: 'center', width: 72 }}>
                <TouchableOpacity 
                  onPress={() => setActiveStoryIndex(i)}
                  style={styles.storyThumbnailCardContainerFrame}
                >
                  <Image source={{ uri: story.mediaUrl }} style={styles.storyMediaThumbnailNativeImg} />
                </TouchableOpacity>
                <Text style={styles.dashedStoryCreativeAdderLabelText} numberOfLines={1}>Me</Text>
              </View>
            ))}`;

content = content.replace(oldStoriesList, newStoriesList);

// 3. Add Floating Add Post Button before Modals
const modalsMarker = `{/* Primary Native Modal Layer Infrastructure Subsystem */}`;
const floatingButton = `{/* Floating Add Post Button */}
      <View style={styles.floatingAddPostButtonContainer}>
        <TouchableOpacity 
          onPress={() => setIsPostCreatorOpen(true)}
          style={styles.floatingAddPostButton}
          activeOpacity={0.9}
        >
          <Plus size={20} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.floatingAddPostButtonText}>Add Post</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Native Modal Layer Infrastructure Subsystem */}`;
content = content.replace(modalsMarker, floatingButton);

// 4. Update Styles
const oldStoriesStyles = `storiesHorizontalListTrack: { paddingLeft: 24, paddingRight: 12, gap: 12 },
  dashedStoryCreativeAdderCardTrigger: { width: 112, height: 164, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc' },
  innerCircularPlusBadgeWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 87, 189, 0.06)', justifyContent: 'center', alignItems: 'center' },
  dashedStoryCreativeAdderLabelText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  storyThumbnailCardContainerFrame: { width: 112, height: 164, borderRadius: 24, overflow: 'hidden', position: 'relative', backgroundColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
  storyMediaThumbnailNativeImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  absoluteBottomFadedScrimOverlayGradient: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.25)' },
  storyTimestampAbsoluteMetaLabelText: { position: 'absolute', bottom: 10, left: 10, color: '#ffffff', fontSize: 11, fontWeight: '600' },`;

const newStoriesStyles = `storiesHorizontalListTrack: { paddingLeft: 24, paddingRight: 12, gap: 16 },
  dashedStoryCreativeAdderCardTrigger: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderStyle: 'dashed', borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' },
  dashedStoryCreativeAdderLabelText: { fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 8, textAlign: 'center' },
  storyThumbnailCardContainerFrame: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', borderWidth: 2, borderColor: '#0057bd', padding: 2 },
  storyMediaThumbnailNativeImg: { width: '100%', height: '100%', borderRadius: 32, resizeMode: 'cover' },
  
  floatingAddPostButtonContainer: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  floatingAddPostButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 99, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  floatingAddPostButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },`;

content = content.replace(oldStoriesStyles, newStoriesStyles);

fs.writeFileSync('/home/harsh/Aqualyn/aqualyn-mobile/src/screens/ProfileScreen.tsx', content);
