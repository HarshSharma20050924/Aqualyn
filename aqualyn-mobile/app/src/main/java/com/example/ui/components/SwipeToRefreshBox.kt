package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Velocity
import androidx.compose.ui.unit.dp

@Composable
fun SwipeToRefreshBox(
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier,
    indicatorColor: Color = Color(0xFF0091EA),
    content: @Composable () -> Unit
) {
    val density = LocalDensity.current
    val thresholdPx = with(density) { 80.dp.toPx() }
    
    var pullOffset by remember { mutableStateOf(0f) }
    
    // Smooth transition from pulling offset back to 0 or keeping it active during refresh
    val animatedOffset by animateFloatAsState(
        targetValue = if (isRefreshing) with(density) { 64.dp.toPx() } else pullOffset,
        animationSpec = spring(dampingRatio = 0.75f, stiffness = Spring.StiffnessMedium),
        label = "pullOffsetAnimation"
    )
    
    val nestedScrollConnection = remember {
        object : NestedScrollConnection {
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                // When scrolling up, consume drag to decrease pullOffset first
                return if (available.y < 0 && pullOffset > 0) {
                    val prevOffset = pullOffset
                    pullOffset = (pullOffset + available.y).coerceAtLeast(0f)
                    val consumed = pullOffset - prevOffset
                    Offset(0f, consumed)
                } else {
                    Offset.Zero
                }
            }

            override fun onPostScroll(
                consumed: Offset,
                available: Offset,
                source: NestedScrollSource
            ): Offset {
                // When dragging down and there's unused scroll, drag pullOffset with dampening
                return if (available.y > 0) {
                    val prevOffset = pullOffset
                    pullOffset = (pullOffset + available.y * 0.45f).coerceAtMost(thresholdPx * 1.6f)
                    val consumed = pullOffset - prevOffset
                    Offset(0f, consumed)
                } else {
                    Offset.Zero
                }
            }

            override suspend fun onPreFling(available: Velocity): Velocity {
                return Velocity.Zero
            }

            override suspend fun onPostFling(consumed: Velocity, available: Velocity): Velocity {
                if (pullOffset >= thresholdPx && !isRefreshing) {
                    onRefresh()
                }
                pullOffset = 0f
                return Velocity.Zero
            }
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .nestedScroll(nestedScrollConnection)
    ) {
        // Core Content offset down dynamically with spring
        Box(
            modifier = Modifier
                .fillMaxSize()
                .offset(y = with(density) { (animatedOffset * 0.75f).toDp() })
        ) {
            content()
        }

        // Beautiful floating reload spinner
        if (animatedOffset > 10f) {
            val scale = (animatedOffset / thresholdPx).coerceIn(0.2f, 1.2f)
            
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = with(density) { (animatedOffset * 0.45f).coerceAtMost(44.dp.toPx()).toDp() })
                    .scale(scale)
                    .shadow(elevation = 6.dp, shape = CircleShape)
                    .background(Color.White, CircleShape)
                    .size(42.dp),
                contentAlignment = Alignment.Center
            ) {
                if (isRefreshing) {
                    CircularProgressIndicator(
                        color = indicatorColor,
                        strokeWidth = 3.dp,
                        modifier = Modifier.size(22.dp)
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Swipe to refresh indicator",
                        tint = indicatorColor,
                        modifier = Modifier
                            .size(24.dp)
                            .rotate(pullOffset * 2.5f)
                    )
                }
            }
        }
    }
}
