import { createContext, useContext, useReducer, useCallback } from 'react';
import { calculateTicketPrice } from '../utils/priceCalculator';

const BookingContext = createContext(null);

const initialState = {
  movie: null,
  cinema: null,
  showtime: null,
  selectedSeats: [],
  selectedCombos: [],
  ticketTotal: 0,
  comboTotal: 0,
  discount: 0,
  grandTotal: 0,
  currentStep: 1,
  bookingTimer: 600,
  timerActive: false,
  promoCode: null,
  holdToken: null,
  holdExpiresAt: null,
  order: null,
};

function getSecondsUntil(timestamp) {
  if (!timestamp) return 600;

  const diffMs = new Date(timestamp).getTime() - Date.now();
  const diffSeconds = Math.ceil(diffMs / 1000);

  return Math.max(0, diffSeconds);
}

function recalcTotals(state) {
  const ticketTotal = state.selectedSeats.reduce((sum, seat) => {
    const price = calculateTicketPrice(
      state.showtime?.basePrice || 0,
      seat.surcharge,
      state.showtime?.policyMultiplier || 1
    );
    return sum + price;
  }, 0);

  const comboTotal = state.selectedCombos.reduce(
    (sum, c) => sum + c.unitPrice * c.quantity,
    0
  );

  const grandTotal = ticketTotal + comboTotal - state.discount;

  return { ...state, ticketTotal, comboTotal, grandTotal };
}

function bookingReducer(state, action) {
  switch (action.type) {
    case 'SELECT_MOVIE':
      return {
        ...initialState,
        movie: action.payload,
        currentStep: 2,
      };

    case 'SELECT_CINEMA':
      return {
        ...state,
        cinema: action.payload,
        showtime: null,
        selectedSeats: [],
        selectedCombos: [],
        discount: 0,
        promoCode: null,
        holdToken: null,
        holdExpiresAt: null,
      };

    case 'SELECT_SHOWTIME':
      return recalcTotals({
        ...state,
        showtime: action.payload,
        selectedSeats: [],
        selectedCombos: [],
        currentStep: 3,
        bookingTimer: 600,
        timerActive: true,
        discount: 0,
        promoCode: null,
        holdToken: null,
        holdExpiresAt: null,
      });

    case 'TOGGLE_SEAT': {
      const seat = action.payload;
      const exists = state.selectedSeats.find(
        (s) => s.row === seat.row && s.col === seat.col
      );

      let newSeats;

      if (exists) {
        newSeats = state.selectedSeats.filter(
          (s) => !(s.row === seat.row && s.col === seat.col)
        );
      } else {
        if (state.selectedSeats.length >= 8) return state;
        newSeats = [...state.selectedSeats, seat];
      }

      newSeats.sort((a, b) => a.row.localeCompare(b.row) || a.col - b.col);

      return recalcTotals({
        ...state,
        selectedSeats: newSeats,
        holdToken: null,
        holdExpiresAt: null,
      });
    }

    case 'UPDATE_COMBO': {
      const { productId, name, unitPrice, delta } = action.payload;
      const existing = state.selectedCombos.find((c) => c.productId === productId);

      let newCombos;

      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          newCombos = state.selectedCombos.filter((c) => c.productId !== productId);
        } else {
          newCombos = state.selectedCombos.map((c) =>
            c.productId === productId ? { ...c, quantity: newQty } : c
          );
        }
      } else if (delta > 0) {
        newCombos = [
          ...state.selectedCombos,
          { productId, name, unitPrice, quantity: 1 },
        ];
      } else {
        newCombos = state.selectedCombos;
      }

      return recalcTotals({ ...state, selectedCombos: newCombos });
    }

    case 'APPLY_PROMO': {
      const { code, discountAmount } = action.payload;
      return recalcTotals({
        ...state,
        promoCode: code,
        discount: discountAmount,
      });
    }

    case 'SET_HOLD': {
      const { holdToken, holdExpiresAt } = action.payload;

      return {
        ...state,
        holdToken,
        holdExpiresAt,
        bookingTimer: getSecondsUntil(holdExpiresAt),
        timerActive: true,
      };
    }

    case 'CLEAR_HOLD':
      return {
        ...state,
        holdToken: null,
        holdExpiresAt: null,
      };

    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

    case 'TICK_TIMER': {
      if (state.bookingTimer <= 1) {
        return { ...initialState };
      }

      return { ...state, bookingTimer: state.bookingTimer - 1 };
    }

    case 'CONFIRM_ORDER':
      return {
        ...state,
        order: {
          orderId: action.payload.orderId,
          ...action.payload,
          movie: state.movie,
          cinema: state.cinema,
          showtime: state.showtime,
          seats: state.selectedSeats,
          combos: state.selectedCombos,
          ticketTotal: state.ticketTotal,
          comboTotal: state.comboTotal,
          discount: state.discount,
          grandTotal: state.grandTotal,
          createdAt: new Date().toISOString(),
        },
        currentStep: 6,
        timerActive: false,
        holdToken: null,
        holdExpiresAt: null,
      };

    case 'RESET_BOOKING':
      return { ...initialState };

    default:
      return state;
  }
}

export function BookingProvider({ children }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const selectMovie = useCallback(
    (movie) => dispatch({ type: 'SELECT_MOVIE', payload: movie }),
    []
  );
  const selectCinema = useCallback(
    (cinema) => dispatch({ type: 'SELECT_CINEMA', payload: cinema }),
    []
  );
  const selectShowtime = useCallback(
    (showtime) => dispatch({ type: 'SELECT_SHOWTIME', payload: showtime }),
    []
  );
  const toggleSeat = useCallback(
    (seat) => dispatch({ type: 'TOGGLE_SEAT', payload: seat }),
    []
  );
  const updateCombo = useCallback(
    (combo) => dispatch({ type: 'UPDATE_COMBO', payload: combo }),
    []
  );
  const applyPromo = useCallback(
    (promo) => dispatch({ type: 'APPLY_PROMO', payload: promo }),
    []
  );
  const setHold = useCallback(
    (hold) => dispatch({ type: 'SET_HOLD', payload: hold }),
    []
  );
  const clearHold = useCallback(
    () => dispatch({ type: 'CLEAR_HOLD' }),
    []
  );
  const setStep = useCallback(
    (step) => dispatch({ type: 'SET_STEP', payload: step }),
    []
  );
  const tickTimer = useCallback(
    () => dispatch({ type: 'TICK_TIMER' }),
    []
  );
  const confirmOrder = useCallback(
    (info) => dispatch({ type: 'CONFIRM_ORDER', payload: info }),
    []
  );
  const resetBooking = useCallback(
    () => dispatch({ type: 'RESET_BOOKING' }),
    []
  );

  return (
    <BookingContext.Provider
      value={{
        ...state,
        selectMovie,
        selectCinema,
        selectShowtime,
        toggleSeat,
        updateCombo,
        applyPromo,
        setHold,
        clearHold,
        setStep,
        tickTimer,
        confirmOrder,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}

export default BookingContext;