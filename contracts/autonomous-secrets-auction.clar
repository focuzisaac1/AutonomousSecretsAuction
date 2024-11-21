;; Autonomous Secrets Auction

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-found (err u404))
(define-constant err-unauthorized (err u403))
(define-constant err-auction-ended (err u401))
(define-constant err-bid-too-low (err u400))

;; Data variables
(define-data-var current-auction-id uint u0)

;; Maps
(define-map auctions uint {
  seller: principal,
  encrypted-secret: (buff 256),
  highest-bid: uint,
  highest-bidder: (optional principal),
  end-block: uint
})

(define-map bids {auction-id: uint, bidder: principal} uint)

;; Public functions

;; Create a new auction
(define-public (create-auction (encrypted-secret (buff 256)) (duration uint))
  (let
    (
      (auction-id (+ (var-get current-auction-id) u1))
    )
    (map-set auctions auction-id {
      seller: tx-sender,
      encrypted-secret: encrypted-secret,
      highest-bid: u0,
      highest-bidder: none,
      end-block: (+ block-height duration)
    })
    (var-set current-auction-id auction-id)
    (ok auction-id)
  )
)

;; Place a bid
(define-public (place-bid (auction-id uint) (bid-amount uint))
  (let
    (
      (auction (unwrap! (map-get? auctions auction-id) err-not-found))
      (current-bid (default-to u0 (map-get? bids {auction-id: auction-id, bidder: tx-sender})))
    )
    (asserts! (< block-height (get end-block auction)) err-auction-ended)
    (asserts! (> bid-amount (get highest-bid auction)) err-bid-too-low)
    (map-set auctions auction-id
      (merge auction {
        highest-bid: bid-amount,
        highest-bidder: (some tx-sender)
      })
    )
    (map-set bids {auction-id: auction-id, bidder: tx-sender} bid-amount)
    (ok true)
  )
)

;; End auction and reveal secret
(define-public (end-auction (auction-id uint))
  (let
    (
      (auction (unwrap! (map-get? auctions auction-id) err-not-found))
    )
    (asserts! (>= block-height (get end-block auction)) err-unauthorized)
    (asserts! (is-eq tx-sender (get seller auction)) err-unauthorized)
    (ok (get encrypted-secret auction))
  )
)

;; Read-only functions

(define-read-only (get-auction-info (auction-id uint))
  (map-get? auctions auction-id))

(define-read-only (get-bid (auction-id uint) (bidder principal))
  (map-get? bids {auction-id: auction-id, bidder: bidder}))

