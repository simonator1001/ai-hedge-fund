import sys

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langgraph.graph import END, StateGraph
from colorama import Fore, Style, init
import questionary
from src.agents.portfolio_manager import portfolio_management_agent
from src.agents.risk_manager import risk_management_agent
from src.graph.state import AgentState
from src.utils.display import print_trading_output
from src.utils.analysts import ANALYST_ORDER, get_analyst_nodes
from src.utils.progress import progress
from src.llm.models import LLM_ORDER, OLLAMA_LLM_ORDER, get_model_info, ModelProvider
from src.utils.ollama import ensure_ollama_and_model

import argparse
from datetime import datetime
from dateutil.relativedelta import relativedelta
from src.utils.visualize import save_graph_as_png
import json

# Load environment variables from .env file
load_dotenv()

init(autoreset=True)

# For SSE: emit progress as lines like PROGRESS:{"percent": 30, "status": "..."}
_sse_progress_percent = 0
def sse_progress_callback(agent_name, ticker, status):
    global _sse_progress_percent
    # For demo: increment by 7% per update, cap at 97%
    _sse_progress_percent = min(_sse_progress_percent + 7, 97)
    msg = status
    if ticker:
        msg = f"{agent_name.replace('_agent','').title()} [{ticker}]: {status}"
    print(f"PROGRESS:{{\"percent\": {_sse_progress_percent}, \"status\": \"{msg}\"}}", flush=True)

progress.on_update = sse_progress_callback

def parse_hedge_fund_response(response):
    """Parses a JSON string and returns a dictionary."""
    try:
        return json.loads(response)
    except json.JSONDecodeError as e:
        print(f"JSON decoding error: {e}\nResponse: {repr(response)}")
        return None
    except TypeError as e:
        print(f"Invalid response type (expected string, got {type(response).__name__}): {e}")
        return None
    except Exception as e:
        print(f"Unexpected error while parsing response: {e}\nResponse: {repr(response)}")
        return None



##### Run the Hedge Fund #####
def run_hedge_fund(
    tickers: list[str],
    start_date: str,
    end_date: str,
    portfolio: dict,
    show_reasoning: bool = False,
    selected_analysts: list[str] = [],
    model_name: str = "gpt-4o",
    model_provider: str = "OpenAI",
):
    # Start progress tracking
    progress.start()

    try:
        # Create a new workflow if analysts are customized
        if selected_analysts:
            workflow = create_workflow(selected_analysts)
            agent = workflow.compile()
        else:
            agent = app

        final_state = agent.invoke(
            {
                "messages": [
                    HumanMessage(
                        content="Make trading decisions based on the provided data.",
                    )
                ],
                "data": {
                    "tickers": tickers,
                    "portfolio": portfolio,
                    "start_date": start_date,
                    "end_date": end_date,
                    "analyst_signals": {},
                },
                "metadata": {
                    "show_reasoning": show_reasoning,
                    "model_name": model_name,
                    "model_provider": model_provider,
                },
            },
        )

        return {
            "decisions": parse_hedge_fund_response(final_state["messages"][-1].content),
            "analyst_signals": final_state["data"]["analyst_signals"],
        }
    finally:
        # Stop progress tracking
        progress.stop()


def start(state: AgentState):
    """Initialize the workflow with the input message."""
    return state


def create_workflow(selected_analysts=None):
    """Create the workflow with selected analysts."""
    workflow = StateGraph(AgentState)
    workflow.add_node("start_node", start)

    # Get analyst nodes from the configuration
    analyst_nodes = get_analyst_nodes()

    # Default to all analysts if none selected
    if selected_analysts is None:
        selected_analysts = list(analyst_nodes.keys())
    # Add selected analyst nodes
    for analyst_key in selected_analysts:
        node_name, node_func = analyst_nodes[analyst_key]
        workflow.add_node(node_name, node_func)
        workflow.add_edge("start_node", node_name)

    # Always add risk and portfolio management
    workflow.add_node("risk_management_agent", risk_management_agent)
    workflow.add_node("portfolio_management_agent", portfolio_management_agent)

    # Connect selected analysts to risk management
    for analyst_key in selected_analysts:
        node_name = analyst_nodes[analyst_key][0]
        workflow.add_edge(node_name, "risk_management_agent")

    workflow.add_edge("risk_management_agent", "portfolio_management_agent")
    workflow.add_edge("portfolio_management_agent", END)

    workflow.set_entry_point("start_node")
    return workflow


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the hedge fund trading system")
    parser.add_argument(
        "--initial-cash",
        type=float,
        default=100000.0,
        help="Initial cash position. Defaults to 100000.0)"
    )
    parser.add_argument(
        "--margin-requirement",
        type=float,
        default=0.0,
        help="Initial margin requirement. Defaults to 0.0"
    )
    parser.add_argument("--tickers", type=str, required=True, help="Comma-separated list of stock ticker symbols")
    parser.add_argument(
        "--start-date",
        type=str,
        help="Start date (YYYY-MM-DD). Defaults to 3 months before end date",
    )
    parser.add_argument("--end-date", type=str, help="End date (YYYY-MM-DD). Defaults to today")
    parser.add_argument("--show-reasoning", action="store_true", help="Show reasoning from each agent")
    parser.add_argument(
        "--show-agent-graph", action="store_true", help="Show the agent graph"
    )
    parser.add_argument(
        "--ollama", action="store_true", help="Use Ollama for local LLM inference"
    )
    parser.add_argument(
        "--excel-output",
        type=str,
        help="Export results to Excel file (e.g., 'trading_results.xlsx')"
    )
    parser.add_argument("--selected-analysts", type=str, help="Comma-separated list of analysts (e.g., ben_graham,charlie_munger)")
    parser.add_argument("--model-choice", type=str, help="LLM model name (e.g., gpt-4o)")
    parser.add_argument("--model-provider", type=str, help="LLM provider (e.g., OpenAI, Groq, Ollama)")

    args = parser.parse_args()

    # Parse tickers from comma-separated string
    tickers = [ticker.strip() for ticker in args.tickers.split(",")]

    # Analyst selection logic
    if args.selected_analysts:
        selected_analysts = [a.strip() for a in args.selected_analysts.split(",")]
    elif sys.stdin.isatty():
        choices = questionary.checkbox(
            "Select your AI analysts.",
            choices=[questionary.Choice(display, value=value) for display, value in ANALYST_ORDER],
            instruction="\n\nInstructions: \n1. Press Space to select/unselect analysts.\n2. Press 'a' to select/unselect all.\n3. Press Enter when done to run the hedge fund.\n",
            validate=lambda x: len(x) > 0 or "You must select at least one analyst.",
            style=questionary.Style([
                ("checkbox-selected", "fg:green"),
                ("selected", "fg:green noinherit"),
                ("highlighted", "noinherit"),
                ("pointer", "noinherit"),
            ]),
        ).ask()
        if not choices:
            print("\n\nInterrupt received. Exiting...")
            sys.exit(0)
        selected_analysts = choices
    else:
        selected_analysts = ["ben_graham"]  # default

    # LLM model selection logic
    if args.model_choice:
        model_choice = args.model_choice
        if args.model_provider:
            model_provider = args.model_provider
        else:
            model_info = get_model_info(model_choice)
            model_provider = model_info.provider.value if model_info else "OpenAI"
    elif sys.stdin.isatty():
        model_choice = questionary.select(
            "Select your LLM model:",
            choices=[questionary.Choice(display, value=value) for display, value, _ in LLM_ORDER],
            style=questionary.Style([
                ("selected", "fg:green bold"),
                ("pointer", "fg:green bold"),
                ("highlighted", "fg:green"),
                ("answer", "fg:green bold"),
            ]),
        ).ask()
        if not model_choice:
            print("\n\nInterrupt received. Exiting...")
            sys.exit(0)
        model_info = get_model_info(model_choice)
        model_provider = model_info.provider.value if model_info else "OpenAI"
    else:
        model_choice = "gpt-4o"
        model_provider = "OpenAI"

    # Create the workflow with selected analysts
    workflow = create_workflow(selected_analysts)
    app = workflow.compile()

    if args.show_agent_graph:
        file_path = ""
        if selected_analysts is not None:
            for selected_analyst in selected_analysts:
                file_path += selected_analyst + "_"
            file_path += "graph.png"
        save_graph_as_png(app, file_path)

    # Validate dates if provided
    if args.start_date:
        try:
            datetime.strptime(args.start_date, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Start date must be in YYYY-MM-DD format")

    if args.end_date:
        try:
            datetime.strptime(args.end_date, "%Y-%m-%d")
        except ValueError:
            raise ValueError("End date must be in YYYY-MM-DD format")

    # Set the start and end dates
    end_date = args.end_date or datetime.now().strftime("%Y-%m-%d")
    if not args.start_date:
        # Calculate 3 months before end_date
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
        start_date = (end_date_obj - relativedelta(months=3)).strftime("%Y-%m-%d")
    else:
        start_date = args.start_date

    # Initialize portfolio with cash amount and stock positions
    portfolio = {
        "cash": args.initial_cash,  # Initial cash amount
        "margin_requirement": args.margin_requirement,  # Initial margin requirement
        "margin_used": 0.0,  # total margin usage across all short positions
        "positions": {
            ticker: {
                "long": 0,  # Number of shares held long
                "short": 0,  # Number of shares held short
                "long_cost_basis": 0.0,  # Average cost basis for long positions
                "short_cost_basis": 0.0,  # Average price at which shares were sold short
                "short_margin_used": 0.0,  # Dollars of margin used for this ticker's short
            } for ticker in tickers
        },
        "realized_gains": {
            ticker: {
                "long": 0.0,  # Realized gains from long positions
                "short": 0.0,  # Realized gains from short positions
            } for ticker in tickers
        }
    }

    # Run the hedge fund
    print("[INFO] Simulation started...")
    result = run_hedge_fund(
        tickers=tickers,
        start_date=start_date,
        end_date=end_date,
        portfolio=portfolio,
        show_reasoning=args.show_reasoning,
        selected_analysts=selected_analysts,
        model_name=model_choice,
        model_provider=model_provider,
    )
    print("[INFO] Simulation completed.")
    print_trading_output(result)
    
    # Export to Excel if requested
    if args.excel_output:
        from src.utils.display import export_trading_results_to_excel
        export_trading_results_to_excel(result, args.excel_output)
        print(f"\nResults exported to {args.excel_output}")
        import base64, json as _json
        # Emit the result JSON as part of the RESULT line
        print(f"RESULT:{{\"outputFile\": \"{args.excel_output}\", \"resultJson\": {_json.dumps(result)} }}", flush=True)
