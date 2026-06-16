import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useAppContext } from '../../src/context/AppContext';
import { Theme } from '../../src/config/theme';
import { Heart, MessageCircle, Send, Bookmark, MoreVertical, Plus } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Post, User } from '../../src/types';

const PostCard = ({ post }: { post: Post }) => {
  const { likePost, savePost, currentUser, globalUsers } = useAppContext();
  const user = globalUsers.find((u: User) => u.id === post.userId) || currentUser;
  const isLiked = currentUser && post.likes.includes(currentUser.id);
  const isSaved = currentUser?.savedPostIds?.includes(post.id);

  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.postUserInfo}>
          <Image source={{ uri: user?.avatar }} style={styles.postAvatar} />
          <Text style={styles.postUsername}>{user?.username || user?.name}</Text>
        </View>
        <TouchableOpacity>
          <MoreVertical size={20} color={Theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Media */}
      <Image source={{ uri: post.mediaUrl }} style={styles.postImage} />

      {/* Actions */}
      <View style={styles.postActions}>
        <View style={styles.postActionGroup}>
          <TouchableOpacity onPress={() => likePost(post.id)} style={styles.actionButton}>
            <Heart size={24} color={isLiked ? Theme.colors.error : Theme.colors.onSurface} fill={isLiked ? Theme.colors.error : 'transparent'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={24} color={Theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Send size={24} color={Theme.colors.onSurface} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => savePost(post.id)}>
          <Bookmark size={24} color={Theme.colors.onSurface} fill={isSaved ? Theme.colors.onSurface : 'transparent'} />
        </TouchableOpacity>
      </View>

      {/* Details */}
      <View style={styles.postDetails}>
        <Text style={styles.likesText}>{post.likes.length} likes</Text>
        {!!post.caption && (
          <Text style={styles.captionText}>
            <Text style={styles.captionUsername}>{user?.username || user?.name} </Text>
            {post.caption}
          </Text>
        )}
        <Text style={styles.timeText}>{post.timestamp}</Text>
      </View>
    </View>
  );
};

export default function FeedScreen() {
  const { posts, stories, currentUser, globalUsers, isFetchingData } = useAppContext();

  const renderHeader = () => (
    <View style={styles.storiesContainer}>
      <View style={styles.storyItem}>
        <View style={styles.storyAvatarContainer}>
          <Image source={{ uri: currentUser?.avatar }} style={styles.storyAvatar} />
          <View style={styles.addStoryBadge}>
            <Plus size={12} color={Theme.colors.onPrimary} />
          </View>
        </View>
        <Text style={styles.storyText}>Your story</Text>
      </View>

      {stories.map((story: any) => (
        <View key={story.id} style={styles.storyItem}>
          <View style={[styles.storyAvatarContainer, styles.storyAvatarContainerActive]}>
            <Image source={{ uri: story.userAvatar }} style={styles.storyAvatar} />
          </View>
          <Text style={styles.storyText} numberOfLines={1}>
            {story.userName}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* App Header */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="light" style={styles.header}>
          <Text style={styles.headerTitle}>Aqualyn</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Heart size={24} color={Theme.colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MessageCircle size={24} color={Theme.colors.onSurface} />
            </TouchableOpacity>
          </View>
        </BlurView>
      ) : (
        <View style={[styles.header, { backgroundColor: Theme.colors.surface }]}>
          <Text style={styles.headerTitle}>Aqualyn</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Heart size={24} color={Theme.colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MessageCircle size={24} color={Theme.colors.onSurface} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Feed List */}
      <FlatList
        data={posts}
        keyExtractor={(item: Post) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceContainer,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  iconButton: {
    padding: Theme.spacing.xs,
  },
  storiesContainer: {
    flexDirection: 'row',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceContainer,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: Theme.spacing.md,
    width: 64,
  },
  storyAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Theme.colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  storyAvatarContainerActive: {
    borderColor: Theme.colors.primary,
  },
  storyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.surface,
  },
  storyText: {
    fontSize: 11,
    color: Theme.colors.onSurface,
    textAlign: 'center',
  },
  postCard: {
    marginBottom: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceContainer,
    paddingBottom: Theme.spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  postUsername: {
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Theme.colors.surfaceContainer,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  postActionGroup: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  actionButton: {},
  postDetails: {
    paddingHorizontal: Theme.spacing.md,
  },
  likesText: {
    fontWeight: '700',
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  captionText: {
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  captionUsername: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
});
