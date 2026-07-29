package ratelimit

import (
	"sync"
	"time"
)

type Limit struct {
	mu             sync.Mutex
	nodes          map[string]*bucketNode
	newestNode     *bucketNode
	oldestNode     *bucketNode
	maxItemCount   int
	maxTokenCount  int
	refillInterval time.Duration
}

func NewLimit(maxItemCount int, maxTokenCount int, refillInterval time.Duration) *Limit {
	if maxItemCount < 1 {
		panic("ratelimit: maxItemCount must be greater than 0")
	}
	if maxTokenCount < 1 {
		panic("ratelimit: maxTokenCount must be greater than 0")
	}
	if refillInterval <= 0 {
		panic("ratelimit: refillInterval must be positive")
	}
	return &Limit{
		nodes:          make(map[string]*bucketNode),
		maxItemCount:   maxItemCount,
		maxTokenCount:  maxTokenCount,
		refillInterval: refillInterval,
	}
}

func (l *Limit) Consume(key string) bool {
	now := time.Now()

	l.mu.Lock()
	defer l.mu.Unlock()

	node, ok := l.nodes[key]
	if !ok {
		newNode := &bucketNode{
			key:            key,
			tokenCount:     l.maxTokenCount - 1,
			lastRefilledAt: now,
		}

		if len(l.nodes) == l.maxItemCount {
			if l.newestNode == l.oldestNode {
				delete(l.nodes, l.oldestNode.key)
				l.newestNode = nil
				l.oldestNode = nil
			} else {
				delete(l.nodes, l.oldestNode.key)
				l.oldestNode.newerNode.olderNode = nil
				l.oldestNode = l.oldestNode.newerNode
			}
		}

		if l.newestNode != nil {
			l.newestNode.newerNode = newNode
			newNode.olderNode = l.newestNode
		}

		l.nodes[key] = newNode
		l.newestNode = newNode
		if l.oldestNode == nil {
			l.oldestNode = newNode
		}

		return true
	}

	refillCount := int(now.Sub(node.lastRefilledAt) / l.refillInterval)
	node.tokenCount += refillCount
	if node.tokenCount > l.maxTokenCount {
		node.tokenCount = l.maxTokenCount
	}
	node.lastRefilledAt = node.lastRefilledAt.Add(l.refillInterval * time.Duration(refillCount))

	if node != l.newestNode {
		if node == l.oldestNode {
			node.newerNode.olderNode = nil
			l.oldestNode = node.newerNode
		} else {
			node.newerNode.olderNode = node.olderNode
			node.olderNode.newerNode = node.newerNode
		}
		node.newerNode = nil
		l.newestNode.newerNode = node
		node.olderNode = l.newestNode
		l.newestNode = node
		if l.oldestNode == nil {
			l.oldestNode = node
		}
	}

	if node.tokenCount < 1 {
		return false
	}

	node.tokenCount--
	return true
}

func (l *Limit) Delete(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	node, ok := l.nodes[key]
	if !ok {
		return false
	}

	if node.newerNode != nil {
		node.newerNode.olderNode = node.olderNode
	}
	if node.olderNode != nil {
		node.olderNode.newerNode = node.newerNode
	}

	delete(l.nodes, node.key)

	if node == l.newestNode {
		l.newestNode = node.olderNode
	}
	if node == l.oldestNode {
		l.oldestNode = node.newerNode
	}

	return true
}

func (l *Limit) Clear() {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.nodes = make(map[string]*bucketNode)
	l.newestNode = nil
	l.oldestNode = nil
}

type bucketNode struct {
	newerNode      *bucketNode
	olderNode      *bucketNode
	key            string
	tokenCount     int
	lastRefilledAt time.Time
}
