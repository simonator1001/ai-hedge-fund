from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from src.tools.api import get_prices
import math
import traceback

app = FastAPI()

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_json(obj):
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: clean_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_json(x) for x in obj]
    else:
        return obj

@app.get("/api/price-history")
def price_history(
    ticker: str = Query(..., description="Stock ticker symbol"),
    start: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end: str = Query(..., description="End date (YYYY-MM-DD)")
):
    try:
        prices = get_prices(ticker, start, end)
        if not prices:
            raise HTTPException(status_code=404, detail="No price data found for this ticker and date range.")
        return JSONResponse(content=clean_json({"prices": prices}))
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error fetching price data for {ticker}: {e}")
        traceback.print_exc()
        return JSONResponse(content={"error": str(e), "trace": traceback.format_exc()}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 