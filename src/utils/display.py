from colorama import Fore, Style
from tabulate import tabulate
from .analysts import ANALYST_ORDER
import os
import json


def sort_agent_signals(signals):
    """Sort agent signals in a consistent order."""
    # Create order mapping from ANALYST_ORDER
    analyst_order = {display: idx for idx, (display, _) in enumerate(ANALYST_ORDER)}
    analyst_order["Risk Management"] = len(ANALYST_ORDER)  # Add Risk Management at the end

    return sorted(signals, key=lambda x: analyst_order.get(x[0], 999))


def print_trading_output(result: dict) -> None:
    """
    Print formatted trading results with colored tables for multiple tickers.

    Args:
        result (dict): Dictionary containing decisions and analyst signals for multiple tickers
    """
    decisions = result.get("decisions")
    if not decisions:
        print(f"{Fore.RED}No trading decisions available{Style.RESET_ALL}")
        return

    # Print decisions for each ticker
    for ticker, decision in decisions.items():
        print(f"\n{Fore.WHITE}{Style.BRIGHT}Analysis for {Fore.CYAN}{ticker}{Style.RESET_ALL}")
        print(f"{Fore.WHITE}{Style.BRIGHT}{'=' * 50}{Style.RESET_ALL}")

        # Prepare analyst signals table for this ticker
        table_data = []
        for agent, signals in result.get("analyst_signals", {}).items():
            if ticker not in signals:
                continue
                
            # Skip Risk Management agent in the signals section
            if agent == "risk_management_agent":
                continue

            signal = signals[ticker]
            agent_name = agent.replace("_agent", "").replace("_", " ").title()
            signal_type = signal.get("signal", "").upper()
            confidence = signal.get("confidence", 0)

            signal_color = {
                "BULLISH": Fore.GREEN,
                "BEARISH": Fore.RED,
                "NEUTRAL": Fore.YELLOW,
            }.get(signal_type, Fore.WHITE)
            
            # Get reasoning if available
            reasoning_str = ""
            if "reasoning" in signal and signal["reasoning"]:
                reasoning = signal["reasoning"]
                
                # Handle different types of reasoning (string, dict, etc.)
                if isinstance(reasoning, str):
                    reasoning_str = reasoning
                elif isinstance(reasoning, dict):
                    # Convert dict to string representation
                    reasoning_str = json.dumps(reasoning, indent=2)
                else:
                    # Convert any other type to string
                    reasoning_str = str(reasoning)
                
                # Wrap long reasoning text to make it more readable
                wrapped_reasoning = ""
                current_line = ""
                # Use a fixed width of 60 characters to match the table column width
                max_line_length = 60
                for word in reasoning_str.split():
                    if len(current_line) + len(word) + 1 > max_line_length:
                        wrapped_reasoning += current_line + "\n"
                        current_line = word
                    else:
                        if current_line:
                            current_line += " " + word
                        else:
                            current_line = word
                if current_line:
                    wrapped_reasoning += current_line
                
                reasoning_str = wrapped_reasoning

            table_data.append(
                [
                    f"{Fore.CYAN}{agent_name}{Style.RESET_ALL}",
                    f"{signal_color}{signal_type}{Style.RESET_ALL}",
                    f"{Fore.WHITE}{confidence}%{Style.RESET_ALL}",
                    f"{Fore.WHITE}{reasoning_str}{Style.RESET_ALL}",
                ]
            )

        # Sort the signals according to the predefined order
        table_data = sort_agent_signals(table_data)

        print(f"\n{Fore.WHITE}{Style.BRIGHT}AGENT ANALYSIS:{Style.RESET_ALL} [{Fore.CYAN}{ticker}{Style.RESET_ALL}]")
        print(
            tabulate(
                table_data,
                headers=[f"{Fore.WHITE}Agent", "Signal", "Confidence", "Reasoning"],
                tablefmt="grid",
                colalign=("left", "center", "right", "left"),
            )
        )

        # Print Trading Decision Table
        action = decision.get("action", "").upper()
        action_color = {
            "BUY": Fore.GREEN,
            "SELL": Fore.RED,
            "HOLD": Fore.YELLOW,
            "COVER": Fore.GREEN,
            "SHORT": Fore.RED,
        }.get(action, Fore.WHITE)

        # Get reasoning and format it
        reasoning = decision.get("reasoning", "")
        # Wrap long reasoning text to make it more readable
        wrapped_reasoning = ""
        if reasoning:
            current_line = ""
            # Use a fixed width of 60 characters to match the table column width
            max_line_length = 60
            for word in reasoning.split():
                if len(current_line) + len(word) + 1 > max_line_length:
                    wrapped_reasoning += current_line + "\n"
                    current_line = word
                else:
                    if current_line:
                        current_line += " " + word
                    else:
                        current_line = word
            if current_line:
                wrapped_reasoning += current_line

        decision_data = [
            ["Action", f"{action_color}{action}{Style.RESET_ALL}"],
            ["Quantity", f"{action_color}{decision.get('quantity')}{Style.RESET_ALL}"],
            [
                "Confidence",
                f"{Fore.WHITE}{decision.get('confidence'):.1f}%{Style.RESET_ALL}",
            ],
            ["Reasoning", f"{Fore.WHITE}{wrapped_reasoning}{Style.RESET_ALL}"],
        ]
        
        print(f"\n{Fore.WHITE}{Style.BRIGHT}TRADING DECISION:{Style.RESET_ALL} [{Fore.CYAN}{ticker}{Style.RESET_ALL}]")
        print(tabulate(decision_data, tablefmt="grid", colalign=("left", "left")))

    # Print Portfolio Summary
    print(f"\n{Fore.WHITE}{Style.BRIGHT}PORTFOLIO SUMMARY:{Style.RESET_ALL}")
    portfolio_data = []
    
    # Extract portfolio manager reasoning (common for all tickers)
    portfolio_manager_reasoning = None
    for ticker, decision in decisions.items():
        if decision.get("reasoning"):
            portfolio_manager_reasoning = decision.get("reasoning")
            break
            
    for ticker, decision in decisions.items():
        action = decision.get("action", "").upper()
        action_color = {
            "BUY": Fore.GREEN,
            "SELL": Fore.RED,
            "HOLD": Fore.YELLOW,
            "COVER": Fore.GREEN,
            "SHORT": Fore.RED,
        }.get(action, Fore.WHITE)
        portfolio_data.append(
            [
                f"{Fore.CYAN}{ticker}{Style.RESET_ALL}",
                f"{action_color}{action}{Style.RESET_ALL}",
                f"{action_color}{decision.get('quantity')}{Style.RESET_ALL}",
                f"{Fore.WHITE}{decision.get('confidence'):.1f}%{Style.RESET_ALL}",
            ]
        )

    headers = [f"{Fore.WHITE}Ticker", "Action", "Quantity", "Confidence"]
    
    # Print the portfolio summary table
    print(
        tabulate(
            portfolio_data,
            headers=headers,
            tablefmt="grid",
            colalign=("left", "center", "right", "right"),
        )
    )
    
    # Print Portfolio Manager's reasoning if available
    if portfolio_manager_reasoning:
        # Handle different types of reasoning (string, dict, etc.)
        reasoning_str = ""
        if isinstance(portfolio_manager_reasoning, str):
            reasoning_str = portfolio_manager_reasoning
        elif isinstance(portfolio_manager_reasoning, dict):
            # Convert dict to string representation
            reasoning_str = json.dumps(portfolio_manager_reasoning, indent=2)
        else:
            # Convert any other type to string
            reasoning_str = str(portfolio_manager_reasoning)
            
        # Wrap long reasoning text to make it more readable
        wrapped_reasoning = ""
        current_line = ""
        # Use a fixed width of 60 characters to match the table column width
        max_line_length = 60
        for word in reasoning_str.split():
            if len(current_line) + len(word) + 1 > max_line_length:
                wrapped_reasoning += current_line + "\n"
                current_line = word
            else:
                if current_line:
                    current_line += " " + word
                else:
                    current_line = word
        if current_line:
            wrapped_reasoning += current_line
            
        print(f"\n{Fore.WHITE}{Style.BRIGHT}Portfolio Strategy:{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{wrapped_reasoning}{Style.RESET_ALL}")


def print_backtest_results(table_rows: list) -> None:
    """Print the backtest results in a nicely formatted table"""
    # Clear the screen
    os.system("cls" if os.name == "nt" else "clear")

    # Split rows into ticker rows and summary rows
    ticker_rows = []
    summary_rows = []

    for row in table_rows:
        if isinstance(row[1], str) and "PORTFOLIO SUMMARY" in row[1]:
            summary_rows.append(row)
        else:
            ticker_rows.append(row)

    
    # Display latest portfolio summary
    if summary_rows:
        latest_summary = summary_rows[-1]
        print(f"\n{Fore.WHITE}{Style.BRIGHT}PORTFOLIO SUMMARY:{Style.RESET_ALL}")

        # Extract values and remove commas before converting to float
        cash_str = latest_summary[7].split("$")[1].split(Style.RESET_ALL)[0].replace(",", "")
        position_str = latest_summary[6].split("$")[1].split(Style.RESET_ALL)[0].replace(",", "")
        total_str = latest_summary[8].split("$")[1].split(Style.RESET_ALL)[0].replace(",", "")

        print(f"Cash Balance: {Fore.CYAN}${float(cash_str):,.2f}{Style.RESET_ALL}")
        print(f"Total Position Value: {Fore.YELLOW}${float(position_str):,.2f}{Style.RESET_ALL}")
        print(f"Total Value: {Fore.WHITE}${float(total_str):,.2f}{Style.RESET_ALL}")
        print(f"Return: {latest_summary[9]}")
        
        # Display performance metrics if available
        if latest_summary[10]:  # Sharpe ratio
            print(f"Sharpe Ratio: {latest_summary[10]}")
        if latest_summary[11]:  # Sortino ratio
            print(f"Sortino Ratio: {latest_summary[11]}")
        if latest_summary[12]:  # Max drawdown
            print(f"Max Drawdown: {latest_summary[12]}")

    # Add vertical spacing
    print("\n" * 2)

    # Print the table with just ticker rows
    print(
        tabulate(
            ticker_rows,
            headers=[
                "Date",
                "Ticker",
                "Action",
                "Quantity",
                "Price",
                "Shares",
                "Position Value",
                "Bullish",
                "Bearish",
                "Neutral",
            ],
            tablefmt="grid",
            colalign=(
                "left",  # Date
                "left",  # Ticker
                "center",  # Action
                "right",  # Quantity
                "right",  # Price
                "right",  # Shares
                "right",  # Position Value
                "right",  # Bullish
                "right",  # Bearish
                "right",  # Neutral
            ),
        )
    )

    # Add vertical spacing
    print("\n" * 4)


def format_backtest_row(
    date: str,
    ticker: str,
    action: str,
    quantity: float,
    price: float,
    shares_owned: float,
    position_value: float,
    bullish_count: int,
    bearish_count: int,
    neutral_count: int,
    is_summary: bool = False,
    total_value: float = None,
    return_pct: float = None,
    cash_balance: float = None,
    total_position_value: float = None,
    sharpe_ratio: float = None,
    sortino_ratio: float = None,
    max_drawdown: float = None,
) -> list[any]:
    """Format a row for the backtest results table"""
    # Color the action
    action_color = {
        "BUY": Fore.GREEN,
        "COVER": Fore.GREEN,
        "SELL": Fore.RED,
        "SHORT": Fore.RED,
        "HOLD": Fore.WHITE,
    }.get(action.upper(), Fore.WHITE)

    if is_summary:
        return_color = Fore.GREEN if return_pct >= 0 else Fore.RED
        return [
            date,
            f"{Fore.WHITE}{Style.BRIGHT}PORTFOLIO SUMMARY{Style.RESET_ALL}",
            "",  # Action
            "",  # Quantity
            "",  # Price
            "",  # Shares
            f"{Fore.YELLOW}${total_position_value:,.2f}{Style.RESET_ALL}",  # Total Position Value
            f"{Fore.CYAN}${cash_balance:,.2f}{Style.RESET_ALL}",  # Cash Balance
            f"{Fore.WHITE}${total_value:,.2f}{Style.RESET_ALL}",  # Total Value
            f"{return_color}{return_pct:+.2f}%{Style.RESET_ALL}",  # Return
            f"{Fore.YELLOW}{sharpe_ratio:.2f}{Style.RESET_ALL}" if sharpe_ratio is not None else "",  # Sharpe Ratio
            f"{Fore.YELLOW}{sortino_ratio:.2f}{Style.RESET_ALL}" if sortino_ratio is not None else "",  # Sortino Ratio
            f"{Fore.RED}{abs(max_drawdown):.2f}%{Style.RESET_ALL}" if max_drawdown is not None else "",  # Max Drawdown
        ]
    else:
        return [
            date,
            f"{Fore.CYAN}{ticker}{Style.RESET_ALL}",
            f"{action_color}{action.upper()}{Style.RESET_ALL}",
            f"{action_color}{quantity:,.0f}{Style.RESET_ALL}",
            f"{Fore.WHITE}{price:,.2f}{Style.RESET_ALL}",
            f"{Fore.WHITE}{shares_owned:,.0f}{Style.RESET_ALL}",
            f"{Fore.YELLOW}{position_value:,.2f}{Style.RESET_ALL}",
            f"{Fore.GREEN}{bullish_count}{Style.RESET_ALL}",
            f"{Fore.RED}{bearish_count}{Style.RESET_ALL}",
            f"{Fore.BLUE}{neutral_count}{Style.RESET_ALL}",
        ]


def export_backtest_results_to_excel(performance_df, table_rows, output_file):
    """Export backtest results to an Excel file"""
    import pandas as pd
    from datetime import datetime
    
    # Create a Pandas Excel writer using XlsxWriter as the engine
    writer = pd.ExcelWriter(output_file, engine='xlsxwriter')
    
    # Convert table_rows to DataFrame
    columns = [
        'Date', 'Ticker', 'Action', 'Quantity', 'Price', 'Shares Owned',
        'Position Value', 'Bullish Count', 'Bearish Count', 'Neutral Count'
    ]
    
    # Filter out summary rows and convert to DataFrame
    trade_rows = [row for row in table_rows if not isinstance(row[1], str) or "PORTFOLIO SUMMARY" not in row[1]]
    trades_df = pd.DataFrame(trade_rows, columns=columns)
    
    # Write the trades DataFrame to the first sheet
    trades_df.to_excel(writer, sheet_name='Trades', index=False)
    
    # Write the performance DataFrame to the second sheet
    performance_df.to_excel(writer, sheet_name='Performance', index=True)
    
    # Get the xlsxwriter workbook and worksheet objects
    workbook = writer.book
    trades_worksheet = writer.sheets['Trades']
    performance_worksheet = writer.sheets['Performance']
    
    # Add some formatting
    header_format = workbook.add_format({
        'bold': True,
        'text_wrap': True,
        'valign': 'top',
        'fg_color': '#D7E4BC',
        'border': 1
    })
    
    # Format the headers
    for col_num, value in enumerate(trades_df.columns.values):
        trades_worksheet.write(0, col_num, value, header_format)
        trades_worksheet.set_column(col_num, col_num, 15)  # Set column width
    
    for col_num, value in enumerate(performance_df.columns.values):
        performance_worksheet.write(0, col_num, value, header_format)
        performance_worksheet.set_column(col_num, col_num, 15)
    
    # Save the Excel file
    writer.close()
    
    print(f"\nResults exported to {output_file}")


def export_trading_results_to_excel(result: dict, output_file: str = None):
    """Export trading results to a comprehensive Excel file with multiple worksheets."""
    import pandas as pd
    from datetime import datetime
    
    # Generate default filename if none provided
    if not output_file:
        current_time = datetime.now().strftime("%Y%m%d-%H%M")
        tickers = list(result.get("decisions", {}).keys())
        ticker_str = "_".join(tickers)
        start_date = result.get("data", {}).get("start_date", "")
        end_date = result.get("data", {}).get("end_date", "")
        output_file = f"{start_date} to {end_date} {ticker_str} stock analysis {current_time}.xlsx"
    
    # Create Excel writer
    writer = pd.ExcelWriter(output_file, engine='xlsxwriter')
    workbook = writer.book
    
    # Add formatting
    header_format = workbook.add_format({
        'bold': True,
        'text_wrap': True,
        'valign': 'top',
        'fg_color': '#D7E4BC',
        'border': 1
    })
    
    # 1. Trading Decisions Worksheet
    decisions_data = []
    for ticker, decision in result.get("decisions", {}).items():
        decisions_data.append({
            'Ticker': ticker,
            'Action': decision.get('action', ''),
            'Quantity': decision.get('quantity', 0),
            'Confidence': decision.get('confidence', 0),
            'Reasoning': decision.get('reasoning', '')
        })
    
    if decisions_data:
        decisions_df = pd.DataFrame(decisions_data)
        decisions_df.to_excel(writer, sheet_name='Trading Decisions', index=False)
        worksheet = writer.sheets['Trading Decisions']
        for idx, col in enumerate(decisions_df.columns):
            worksheet.write(0, idx, col, header_format)
            worksheet.set_column(idx, idx, 20 if col != 'Reasoning' else 50)
    
    # 2. Analyst Signals Worksheet
    signals_data = []
    for ticker in result.get("decisions", {}).keys():
        for agent, signals in result.get("analyst_signals", {}).items():
            if ticker in signals:
                signals_data.append({
                    'Ticker': ticker,
                    'Analyst': agent,
                    'Signal': signals[ticker].get('signal', ''),
                    'Confidence': signals[ticker].get('confidence', 0),
                    'Reasoning': signals[ticker].get('reasoning', '')
                })
    
    if signals_data:
        signals_df = pd.DataFrame(signals_data)
        signals_df.to_excel(writer, sheet_name='Analyst Signals', index=False)
        worksheet = writer.sheets['Analyst Signals']
        for idx, col in enumerate(signals_df.columns):
            worksheet.write(0, idx, col, header_format)
            worksheet.set_column(idx, idx, 20 if col != 'Reasoning' else 50)
    
    # 3. Individual Analyst Worksheets - NEW SECTION
    # Create a worksheet for each analyst with their detailed analysis
    for agent, signals in result.get("analyst_signals", {}).items():
        # Skip risk management and portfolio management
        if agent in ['risk_management_agent', 'portfolio_management_agent']:
            continue
            
        # Format the analyst name for the worksheet
        agent_name = agent.replace('_agent', '').replace('_', ' ').title()
        sheet_name = agent_name[:31]  # Excel worksheet names can't exceed 31 chars
        
        analyst_data = []
        for ticker, signal in signals.items():
            # Add basic signal data
            data_row = {
                'Ticker': ticker,
                'Signal': signal.get('signal', ''),
                'Confidence': signal.get('confidence', 0),
                'Reasoning': signal.get('reasoning', '')
            }
            
            # If there's additional analysis data, add it
            if isinstance(signal.get('reasoning'), dict):
                for key, value in signal.get('reasoning', {}).items():
                    if isinstance(value, dict) and 'details' in value:
                        data_row[key] = value.get('details', '')
                    else:
                        data_row[key] = str(value)
            
            analyst_data.append(data_row)
        
        if analyst_data:
            analyst_df = pd.DataFrame(analyst_data)
            analyst_df.to_excel(writer, sheet_name=sheet_name, index=False)
            worksheet = writer.sheets[sheet_name]
            for idx, col in enumerate(analyst_df.columns):
                worksheet.write(0, idx, col, header_format)
                # Set wider column width for text fields
                if col in ['Reasoning'] or 'details' in col.lower():
                    worksheet.set_column(idx, idx, 50)
                else:
                    worksheet.set_column(idx, idx, 15)
    
    # 4. Technical Analysis Worksheet
    tech_data = []
    for ticker, signals in result.get("analyst_signals", {}).get("technical_analyst_agent", {}).items():
        if isinstance(signals, dict) and 'strategy_signals' in signals:
            for strategy, details in signals['strategy_signals'].items():
                if isinstance(details, dict):
                    tech_data.append({
                        'Ticker': ticker,
                        'Strategy': strategy,
                        'Signal': details.get('signal', ''),
                        'Confidence': details.get('confidence', 0),
                        'Metrics': str(details.get('metrics', {}))
                    })
    
    if tech_data:
        tech_df = pd.DataFrame(tech_data)
        tech_df.to_excel(writer, sheet_name='Technical Analysis', index=False)
        worksheet = writer.sheets['Technical Analysis']
        for idx, col in enumerate(tech_df.columns):
            worksheet.write(0, idx, col, header_format)
            worksheet.set_column(idx, idx, 20 if col != 'Metrics' else 40)
    
    # 5. Fundamental Analysis Worksheet
    fund_data = []
    for ticker, signals in result.get("analyst_signals", {}).get("fundamentals_agent", {}).items():
        if isinstance(signals, dict) and 'reasoning' in signals:
            reasoning = signals['reasoning']
            if isinstance(reasoning, dict):
                for aspect, details in reasoning.items():
                    fund_data.append({
                        'Ticker': ticker,
                        'Aspect': aspect,
                        'Signal': details.get('signal', ''),
                        'Details': details.get('details', '')
                    })
    
    if fund_data:
        fund_df = pd.DataFrame(fund_data)
        fund_df.to_excel(writer, sheet_name='Fundamental Analysis', index=False)
        worksheet = writer.sheets['Fundamental Analysis']
        for idx, col in enumerate(fund_df.columns):
            worksheet.write(0, idx, col, header_format)
            worksheet.set_column(idx, idx, 20 if col != 'Details' else 40)
    
    # 6. Sentiment Analysis Worksheet
    sentiment_data = []
    for ticker, signals in result.get("analyst_signals", {}).get("sentiment_agent", {}).items():
        if isinstance(signals, dict):
            sentiment_data.append({
                'Ticker': ticker,
                'Signal': signals.get('signal', ''),
                'Confidence': signals.get('confidence', 0),
                'Reasoning': signals.get('reasoning', '')
            })
    
    if sentiment_data:
        sentiment_df = pd.DataFrame(sentiment_data)
        sentiment_df.to_excel(writer, sheet_name='Sentiment Analysis', index=False)
        worksheet = writer.sheets['Sentiment Analysis']
        for idx, col in enumerate(sentiment_df.columns):
            worksheet.write(0, idx, col, header_format)
            worksheet.set_column(idx, idx, 20 if col != 'Reasoning' else 40)
    
    # Save the Excel file
    writer.close()
    return output_file
