import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

const contractSource = readFileSync('./contracts/autonomous-secrets-auction.clar', 'utf8')

describe('Autonomous Secrets Auction Contract', () => {
  it('should define contract-owner constant', () => {
    expect(contractSource).toContain('(define-constant contract-owner tx-sender)')
  })
  
  it('should define error constants', () => {
    expect(contractSource).toContain('(define-constant err-not-found (err u404))')
    expect(contractSource).toContain('(define-constant err-unauthorized (err u403))')
    expect(contractSource).toContain('(define-constant err-auction-ended (err u401))')
    expect(contractSource).toContain('(define-constant err-bid-too-low (err u400))')
  })
  
  it('should define current-auction-id data variable', () => {
    expect(contractSource).toContain('(define-data-var current-auction-id uint u0)')
  })
  
  it('should define auctions map', () => {
    expect(contractSource).toContain('(define-map auctions uint {')
    expect(contractSource).toContain('seller: principal,')
    expect(contractSource).toContain('encrypted-secret: (buff 256),')
    expect(contractSource).toContain('highest-bid: uint,')
    expect(contractSource).toContain('highest-bidder: (optional principal),')
    expect(contractSource).toContain('end-block: uint')
  })
  
  it('should define bids map', () => {
    expect(contractSource).toContain('(define-map bids {auction-id: uint, bidder: principal} uint)')
  })
  
  it('should have a create-auction function', () => {
    expect(contractSource).toContain('(define-public (create-auction (encrypted-secret (buff 256)) (duration uint))')
  })
  
  it('should set auction details in create-auction function', () => {
    expect(contractSource).toContain('(map-set auctions auction-id {')
    expect(contractSource).toContain('seller: tx-sender,')
    expect(contractSource).toContain('encrypted-secret: encrypted-secret,')
    expect(contractSource).toContain('highest-bid: u0,')
    expect(contractSource).toContain('highest-bidder: none,')
    expect(contractSource).toContain('end-block: (+ block-height duration)')
  })
  
  it('should have a place-bid function', () => {
    expect(contractSource).toContain('(define-public (place-bid (auction-id uint) (bid-amount uint))')
  })
  
  it('should check for auction end in place-bid function', () => {
    expect(contractSource).toContain('(asserts! (< block-height (get end-block auction)) err-auction-ended)')
  })
  
  it('should check for higher bid in place-bid function', () => {
    expect(contractSource).toContain('(asserts! (> bid-amount (get highest-bid auction)) err-bid-too-low)')
  })
  
  it('should have an end-auction function', () => {
    expect(contractSource).toContain('(define-public (end-auction (auction-id uint))')
  })
  
  it('should check for auction end time in end-auction function', () => {
    expect(contractSource).toContain('(asserts! (>= block-height (get end-block auction)) err-unauthorized)')
  })
  
  it('should check for seller authorization in end-auction function', () => {
    expect(contractSource).toContain('(asserts! (is-eq tx-sender (get seller auction)) err-unauthorized)')
  })
  
  it('should have a get-auction-info read-only function', () => {
    expect(contractSource).toContain('(define-read-only (get-auction-info (auction-id uint))')
  })
  
  it('should have a get-bid read-only function', () => {
    expect(contractSource).toContain('(define-read-only (get-bid (auction-id uint) (bidder principal))')
  })
})

