import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'

/**
 * Created on 1401/5/5 (2022/7/27).
 * @author {@link https://mirismaili.github.io S. Mahdi Mir-Ismaili}
 * @param {Object} props
 * @param {boolean} [props.ignoreChildrenLinks=false]
 * @param {boolean} [props.ignoreBeforeunloadDocument=false]
 * @param {boolean} [props.blockRoute=true]
 * @param {React.ReactNode} props.children
 * @param {*} props.ModalComponent
 * @param {Function} [props.preUnloadHook]
 * @param {string} props.alertMessage
 * @returns {React.ReactElement}
 */
export default function PreUnloadHook(
  {
    ignoreChildrenLinks = false,
    ignoreBeforeunloadDocument = false,
    blockRoute = true,
    children,
    ModalComponent,
    preUnloadHook,
    alertMessage = 'Are you sure you want to leave? Changes will not be saved.',
  },
) {
  const childEl = useRef()
  const [{showModal, blockedLink}, setState] = useState(INITIAL_STATE)
  // noinspection JSCheckFunctionSignatures
  const hideModal = useCallback(() => setState((state) => ({...state, showModal: false})), [])
  
  const blockRouteRef = useRef(blockRoute) // initialization is just for type
  blockRouteRef.current = blockRoute
  
  const handleClickEvents = useCallback(function (e) {
    if (!blockRouteRef.current || e.target.href === window.location.href) return true
    e.preventDefault()
    setState({showModal: true, blockedLink: this})
  }, [])
  
  const onUnload = useCallback((e) => {
    if (!blockRouteRef.current) return
    e.preventDefault()
    e.returnValue = alertMessage
    return alertMessage
  }, [alertMessage])
  
  const setEventListeners = useCallback(() => {
    const links = document.getElementsByTagName('a')
    for (const link of links) {
      if (link.getAttribute('href') && (!ignoreChildrenLinks || !childEl.contains(link))) {
        link.addEventListener('click', handleClickEvents, false)
      }
    }
    
    if (!ignoreBeforeunloadDocument) window.addEventListener('beforeunload', onUnload)
  }, [onUnload/* , handleClickEvents // has no dependency */])
  
  const removeEventListeners = useCallback(() => {
    const links = document.getElementsByTagName('a')
    for (const link of links) link.removeEventListener('click', handleClickEvents, false)
    window.removeEventListener('beforeunload', onUnload)
  }, [onUnload/* , handleClickEvents // has no dependency */])
  
  useLayoutEffect(() => {
    setEventListeners()
    return removeEventListeners
  }, [setEventListeners, removeEventListeners])
  
  const handleModalCancel = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])
  
  const handleModalLeave = useCallback(() => {
    if (!blockedLink) return preUnloadHook?.()
    
    const dispatchBlockedEvent = blockedLink.click.bind(blockedLink)
    
    // Reset everything:
    removeEventListeners()
    setState(INITIAL_STATE)
    
    preUnloadHook ? preUnloadHook(dispatchBlockedEvent) : dispatchBlockedEvent()
  }, [preUnloadHook, removeEventListeners, blockedLink])
  
  useEffect(() => {
    if (ModalComponent || !showModal) return
    hideModal()
    const confirmed = confirm(alertMessage)
    if (confirmed) handleModalLeave()
  }, [showModal, !ModalComponent, handleModalLeave])
  
  return React.createElement(React.Fragment, null,
    React.createElement('span', {ref: childEl}, children),
    ModalComponent && React.createElement(ModalComponent, {handleModalLeave, handleModalCancel, showModal}),
  )
}

const INITIAL_STATE = {showModal: false, blockedLink: null}
