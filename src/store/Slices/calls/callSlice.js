import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    callId: null,
    callType: null,
    callerProfile: null,
    isRingingIncoming: false,
    isRingingOutgoing: false,
    calls: [],
    isCallStarting: false,
    isCallStarted: false,
    callStartedDate: null,
    callRecipientList: [],
    isInitialCallsReady: false,
    isCallModalOpen: false,
    isCallAcceptWaiting: false,
};

const callSlice = createSlice({
    name: 'call',
    initialState,
    reducers: {
        setCallId: (state, action) => {
            state.callId = action.payload;
        },
        setCallType: (state, action) => {
            state.callType = action.payload;
        },
        setCallerProfile: (state, action) => {
            state.callerProfile = action.payload;
        },
        setIsRingingIncoming: (state, action) => {
            state.isRingingIncoming = action.payload;
        },
        setIsRingingOutgoing: (state, action) => {
            state.isRingingOutgoing = action.payload;
        },
        setIsCallAcceptWaiting: (state, action) => {
            state.isCallAcceptWaiting = action.payload;
        },
        setIsCallStarted: (state, action) => {
            state.isCallStarted = action.payload;
            state.isCallAcceptWaiting = false;
        },
        setIsCallStarting: (state, action) => {
            state.isCallStarting = action.payload;
        },
        setCallStartedDate: (state, action) => {
            state.callStartedDate = action.payload;
        },
        setCallModalOpen: (state, action) => {
            state.isCallModalOpen = action.payload;
        },
        resetCallState: (state) => {
            state.callId = null;
            state.callType = null;
            state.callerProfile = null;
            state.isRingingIncoming = false;
            state.isRingingOutgoing = false;
            state.isCallStarted = false;
            state.isCallStarting = false;
            state.callStartedDate = null;
            state.isCallModalOpen = false;
            state.isCallAcceptClicked = false;
        },
        setInitialCalls: (state, action) => {
            const initialCallsData = action.payload?.Call;
            if (initialCallsData && Object.keys(initialCallsData).length > 0) {
                const newCalls = Object.entries(initialCallsData).map(([callId, callData]) => ({
                    id: callId,
                    ...callData
                }));
                state.calls = [
                    ...state.calls,
                    ...newCalls.filter(newCall =>
                        !state.calls.some(existingCall => existingCall.id === newCall.id)
                    )
                ];
            }
            state.isInitialCallsReady = true;
        },

        setCallResult: (state, action) => {
            const callResult = action.payload;
            const callId = Object.keys(callResult)[0];
            const callData = callResult[callId];

            if (state.callId === callId) {
                state.isRingingOutgoing = false;
                state.isCallStarted = false;
            }

            const isCallIdExists = state.calls.some(call => call.id === callId);

            if (!isCallIdExists) {
                state.calls.push({ id: callId, ...callData });
            }
        },
        setCallRecipientList: (state, action) => {
            const recipientProfiles = action.payload;

            Object.entries(recipientProfiles).forEach(([recipientId, recipientData]) => {
                const existingRecipientIndex = state.callRecipientList.findIndex(
                    recipient => recipient.id === recipientId
                );
                if (existingRecipientIndex !== -1) {
                    state.callRecipientList[existingRecipientIndex] = { id: recipientId, ...recipientData };
                } else {
                    state.callRecipientList.push({ id: recipientId, ...recipientData });
                }
            });
        },
        updateCallRecipientList: (state, action) => {
            const updateData = action.payload;
            const recipientId = Object.keys(updateData)[0];
            const updateValues = updateData[recipientId];

            const existingRecipientIndex = state.callRecipientList.findIndex(
                recipient => recipient.id === recipientId
            );

            if (existingRecipientIndex !== -1) {
                state.callRecipientList[existingRecipientIndex] = {
                    ...state.callRecipientList[existingRecipientIndex],
                    ...updateValues,
                };
            } else {
                state.callRecipientList.push({
                    id: recipientId,
                    ...updateValues,
                });
            }
        },
        deleteCallHistory: (state, action) => {
            const callId = action.payload;
            state.calls = state.calls.filter(call => call.id !== callId);
        }
    },
});

export const {
    isInitialCallsReady,
    setIsCallStarted,
    setIsCallStarting,
    isCallStarting,
    isCallStarted,
    setCallStartedDate,
    setCallId,
    setCallType,
    setCallerProfile,
    setIsRingingIncoming,
    setIsRingingOutgoing,
    setIsCallAcceptWaiting,
    resetCallState,
    setCallResult,
    setInitialCalls,
    setCallRecipientList,
    callStartedDate,
    updateCallRecipientList,
    deleteCallHistory,
    setCallModalOpen
} = callSlice.actions;

export default callSlice.reducer;

const handleCall = (data, dispatch, userId, isIncoming) => {
    const { callId, callType, ...callerData } = data;
    const callerProfileKey = Object.keys(callerData).find(key => key !== userId);
    const callerProfile = callerProfileKey ? callerData[callerProfileKey] : null;

    dispatch(setCallId(callId));
    dispatch(setCallType(callType));
    dispatch(setCallerProfile(callerProfile));

    if (isIncoming) {
        dispatch(setIsRingingIncoming(true));
    } else {
        dispatch(setIsRingingOutgoing(true));
        dispatch(setIsCallStarting(true));
    }
};

export const handleIncomingCall = (data, dispatch, userId) => {
    handleCall(data, dispatch, userId, true);
};

export const handleOutgoingCall = (data, dispatch, userId) => {
    handleCall(data, dispatch, userId, false);
};

export const handleEndCall = (data, dispatch) => {
    const callId = Object.keys(data)[0];
    const callResult = { [callId]: data[callId] };

    if (callId) {
        dispatch(setCallResult(callResult));
        dispatch(resetCallState());
    }
};
